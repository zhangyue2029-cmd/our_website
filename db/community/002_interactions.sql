BEGIN;

CREATE TABLE community.comment (
    id uuid PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES community.post(id) ON DELETE CASCADE,
    member_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    parent_id uuid,
    body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 1200),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (post_id, id),
    FOREIGN KEY (post_id, parent_id) REFERENCES community.comment(post_id, id) ON DELETE CASCADE
);
CREATE INDEX post_comments_by_date ON community.comment(post_id, created_at DESC, id DESC);

CREATE TABLE community.reaction (
    post_id uuid NOT NULL REFERENCES community.post(id) ON DELETE CASCADE,
    member_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('like', 'bookmark')),
    PRIMARY KEY (post_id, member_id, kind)
);

CREATE TABLE community.post_report (
    post_id uuid NOT NULL REFERENCES community.post(id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, reporter_id)
);
COMMIT;
