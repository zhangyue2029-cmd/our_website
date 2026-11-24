BEGIN;
CREATE TABLE community.moderator (
    member_id uuid PRIMARY KEY REFERENCES accounts.member(id) ON DELETE CASCADE
);
CREATE TABLE community.moderation_action (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id uuid NOT NULL,
    moderator_id uuid REFERENCES accounts.member(id) ON DELETE SET NULL,
    decision text NOT NULL CHECK (decision IN ('hidden', 'visible')),
    reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE community.post_report ADD COLUMN reviewed_at timestamptz;
COMMIT;
