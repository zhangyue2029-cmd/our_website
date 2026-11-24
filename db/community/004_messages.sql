BEGIN;
CREATE TABLE community.conversation (
    id uuid PRIMARY KEY,
    requester_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    recipient_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (requester_id <> recipient_id)
);
CREATE UNIQUE INDEX one_conversation_per_pair
    ON community.conversation (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

CREATE TABLE community.message (
    id uuid PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES community.conversation(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_history ON community.message(conversation_id, created_at DESC, id DESC);

CREATE TABLE community.message_report (
    message_id uuid NOT NULL REFERENCES community.message(id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES accounts.member(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, reporter_id)
);
COMMIT;
