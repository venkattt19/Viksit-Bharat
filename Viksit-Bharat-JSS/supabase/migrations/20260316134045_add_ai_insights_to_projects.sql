/*
  # Add AI Insights to Projects

  1. Changes
    - Add sentiment analysis columns to projects table
      - `sentiment_score` (numeric, -1 to 1, where -1 is negative, 0 is neutral, 1 is positive)
      - `sentiment_label` (text, one of: 'positive', 'neutral', 'negative')
      - `key_topics` (text array, extracted themes and topics)
      - `risk_flags` (text array, concerning keywords detected)
      - `ai_summary` (text, AI-generated summary of project)
      - `last_analyzed_at` (timestamp, when AI analysis was last run)
    
  2. Notes
    - These columns will be populated by the Databricks AI Edge Function
    - Sentiment score helps track project health over time
    - Risk flags enable proactive issue detection
*/

-- Add AI insights columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'sentiment_score'
  ) THEN
    ALTER TABLE projects ADD COLUMN sentiment_score numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'sentiment_label'
  ) THEN
    ALTER TABLE projects ADD COLUMN sentiment_label text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'key_topics'
  ) THEN
    ALTER TABLE projects ADD COLUMN key_topics text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'risk_flags'
  ) THEN
    ALTER TABLE projects ADD COLUMN risk_flags text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'last_analyzed_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN last_analyzed_at timestamptz;
  END IF;
END $$;