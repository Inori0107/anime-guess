export const QUESTION_BANK_SCHEMA = `
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('song', 'character', 'quote')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank (type);
CREATE INDEX IF NOT EXISTS idx_question_bank_created_at ON question_bank (created_at DESC);
`
