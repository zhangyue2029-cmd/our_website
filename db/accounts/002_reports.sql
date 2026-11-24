BEGIN;
CREATE SEQUENCE accounts.report_generation AS bigint;
CREATE TABLE accounts.report (
    member_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    career_id text NOT NULL,
    generation bigint NOT NULL,
    report jsonb NOT NULL,
    saved_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, career_id)
);
COMMIT;
