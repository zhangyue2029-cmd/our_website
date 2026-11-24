BEGIN;
CREATE SCHEMA accounts;
REVOKE ALL ON SCHEMA accounts FROM PUBLIC;

CREATE TABLE accounts.member (
    id uuid PRIMARY KEY,
    username text UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,24}$'),
    display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 40),
    community_role text NOT NULL CHECK (community_role IN ('student', 'employed')),
    password_salt bytea NOT NULL,
    password_hash bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts.session (
    token_hash bytea PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_by_member ON accounts.session(member_id);

CREATE TABLE accounts.background (
    member_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    career_id text NOT NULL,
    draft jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, career_id)
);
COMMIT;
