#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

container=$(docker run --rm -d --network none --env POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine)
trap 'docker stop "$container" >/dev/null 2>&1 || true' EXIT

db() {
  docker exec -i "$container" psql -XqAt -U postgres -v ON_ERROR_STOP=1 "$@"
}

for attempt in {1..60}; do
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then
    docker logs "$container" >&2
    exit 1
  fi
  sleep 0.25
done

db < db/recruitment/001_candidate_batches.sql
seed=$(node tools/recruitment-import.mjs)
[[ $(db <<< "$seed") == t ]]
[[ $(db <<< "$seed") == f ]]
[[ $(db -c 'SELECT count(*) FROM recruitment.batch') == 1 ]]
[[ $(db -c "SELECT count(*) FROM recruitment.batch WHERE (sources->'sources'->'xlsx:10'->'listedDate') = 'null'::jsonb") == 1 ]]
[[ $(db -c 'SELECT count(*) FROM recruitment.released_requirements') == 0 ]]

db <<'SQL'
CREATE ROLE baseline_reader LOGIN;
CREATE ROLE baseline_reviewer LOGIN;
GRANT USAGE ON SCHEMA recruitment TO baseline_reader, baseline_reviewer;
GRANT SELECT ON recruitment.released_requirements TO baseline_reader;
GRANT EXECUTE ON FUNCTION recruitment.review_batch(text, text, text),
                          recruitment.set_active_release(text, text) TO baseline_reviewer;
SQL

expect_error() {
  local output
  if output=$(db -c "$1" 2>&1); then
    printf 'Expected this statement to fail: %s\n' "$1" >&2
    exit 1
  fi
  [[ $output == *"$2"* ]] || { printf '%s\n' "$output" >&2; exit 1; }
}

expect_error 'SET SESSION AUTHORIZATION baseline_reader; SELECT * FROM recruitment.batch' 'permission denied'
expect_error 'SET SESSION AUTHORIZATION baseline_reader; SELECT recruitment.review_batch(NULL, NULL, NULL)' 'permission denied'
expect_error 'SET SESSION AUTHORIZATION baseline_reader; SELECT recruitment.import_batch(NULL, NULL)' 'permission denied'
expect_error "SELECT recruitment.import_batch(jsonb_build_object('version', version, 'status', 'pending_review',
    'requirements', jsonb_set(requirements, '{0,summary}', to_jsonb('conflicting revision'::text))), sources)
    FROM recruitment.batch WHERE version = 'journalism-general-v1'" 'already exists with different data'
expect_error "SELECT recruitment.import_batch(jsonb_build_object('version', 'malformed-v1', 'status', 'pending_review',
    'requirements', jsonb_set(requirements, '{0,industry}', to_jsonb('example'::text))), sources)
    FROM recruitment.batch WHERE version = 'journalism-general-v1'" 'Invalid or duplicate recruitment requirement'

expect_error "SET SESSION AUTHORIZATION baseline_reviewer; SELECT recruitment.set_active_release('journalism-general-v1', 'too early')" 'Only an approved version'
expect_error "SELECT recruitment.import_batch(jsonb_build_object('status','pending_review','version','broken-v1','requirements',jsonb_build_array()), jsonb_build_object('sources',jsonb_build_object()))" 'Invalid recruitment bundle'

variant() {
  db -c "SELECT recruitment.import_batch(jsonb_build_object('version', '$1', 'status', 'pending_review',
    'requirements', jsonb_set(requirements, '{0,summary}', to_jsonb('Revised test text'::text))), sources)
    FROM recruitment.batch WHERE version = 'journalism-general-v1';"
}

[[ $(variant journalism-returned-v1) == t ]]
[[ $(variant journalism-general-v2) == t ]]
db -c "SET SESSION AUTHORIZATION baseline_reviewer;
    SELECT recruitment.review_batch('journalism-returned-v1', 'returned', 'needs more evidence');"
expect_error "SELECT recruitment.set_active_release('journalism-returned-v1', 'not allowed')" 'Only an approved version'
expect_error "SELECT recruitment.review_batch('journalism-general-v1', 'approved', '   ')" 'violates check constraint'
[[ $(db -c "SELECT status FROM recruitment.batch WHERE version = 'journalism-general-v1'") == pending_review ]]

db -c "SET SESSION AUTHORIZATION baseline_reviewer;
    SELECT recruitment.review_batch('journalism-general-v1', 'approved', 'test fixture reviewed');
    SELECT recruitment.set_active_release('journalism-general-v1', 'first fixture release');"
[[ $(db -c 'SET SESSION AUTHORIZATION baseline_reader; SELECT count(*) FROM recruitment.released_requirements') == 44 ]]
[[ $(db -c "SELECT count(*) FROM recruitment.released_requirements WHERE version = 'journalism-general-v2'") == 0 ]]
db -c "SET SESSION AUTHORIZATION baseline_reviewer;
    SELECT recruitment.review_batch('journalism-general-v2', 'approved', 'revised fixture reviewed');
    SELECT recruitment.set_active_release('journalism-general-v2', 'second fixture release');"
[[ $(db -c "SELECT count(*) FROM recruitment.released_requirements WHERE summary = 'Revised test text'") == 1 ]]
db -c "SET SESSION AUTHORIZATION baseline_reviewer;
    SELECT recruitment.set_active_release('journalism-general-v1', 'rollback test');"
[[ $(db -c "SELECT count(*) FROM recruitment.released_requirements WHERE summary = 'Revised test text'") == 0 ]]
db < db/recruitment/export_active.sql | node tools/recruitment-export.mjs | cmp - src/data/recruitment-reference.js
db -c "SET SESSION AUTHORIZATION baseline_reviewer;
    SELECT recruitment.set_active_release(NULL, 'withdraw test');"
[[ $(db -c 'SELECT count(*) FROM recruitment.released_requirements') == 0 ]]
[[ $(db -c "SELECT count(*) FROM recruitment.audit WHERE actor = 'baseline_reviewer'") == 7 ]]
echo 'PASS: PostgreSQL candidate import, deduplication, reviewer permissions, audit, published visibility, rollback and withdrawal.'
