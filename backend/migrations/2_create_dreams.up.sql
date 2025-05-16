CREATE TABLE IF NOT EXISTS dreams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    public_id TEXT UNIQUE NOT NULL DEFAULT (substring(md5(random()::text) for 10)),
    summary TEXT,
    prophecy TEXT,
    title TEXT
);

-- Backfill for existing rows (safe to run multiple times)
UPDATE dreams SET public_id = substring(md5(random()::text) for 10) WHERE public_id IS NULL;

CREATE TABLE IF NOT EXISTS dream_tags (
    id SERIAL PRIMARY KEY,
    dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
); 