-- Migration: add box column to face_embeddings
-- Run this in Supabase SQL editor or via psql connected to your database

ALTER TABLE public.face_embeddings
ADD COLUMN IF NOT EXISTS box jsonb;

-- Optional: if you want to index queries by box keys, create GIN index
-- CREATE INDEX IF NOT EXISTS idx_face_embeddings_box ON public.face_embeddings USING gin (box);
