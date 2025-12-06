-- Local dev Score table used by /api/scores
CREATE TABLE IF NOT EXISTS public."Score" (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nick_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (difficulty IN ('beginner','standard','advanced'))
);

CREATE INDEX IF NOT EXISTS idx_score_difficulty ON public."Score"(difficulty);
CREATE INDEX IF NOT EXISTS idx_score_score_desc ON public."Score"(score DESC);


