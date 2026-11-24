BEGIN;
CREATE SCHEMA community;
REVOKE ALL ON SCHEMA community FROM PUBLIC;

CREATE TABLE community.post (
    id uuid PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    career_id text NOT NULL,
    kind text NOT NULL CHECK (kind IN ('question', 'experience')),
    title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 120),
    body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
    anonymous boolean NOT NULL,
    status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX public_posts_by_career ON community.post(career_id, created_at DESC, id DESC) WHERE status = 'visible';

CREATE VIEW community.public_posts AS
SELECT p.id, p.career_id, p.kind, p.title, p.body, p.anonymous, p.created_at,
       CASE WHEN NOT p.anonymous THEN m.display_name END AS author_name
FROM community.post AS p JOIN accounts.member AS m ON m.id = p.member_id
WHERE p.status = 'visible';
COMMIT;
