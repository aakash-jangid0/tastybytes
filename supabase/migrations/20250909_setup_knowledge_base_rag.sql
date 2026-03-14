-- Migration: Setup Knowledge Base and RAG System
-- Description: Creates the knowledge_base table with vector embeddings and the match_knowledge RPC function for semantic search
-- Created At: 2025-02-21

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_base table for storing restaurant information chunks and their embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('menu', 'general', 'hours', 'payment', 'policy', 'service', 'faq', 'other')),
    embedding vector(768) NOT NULL,  -- Gemini embedding (dimension 768)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at);

-- Create RPC function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION match_knowledge (
    query_embedding vector,
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    category TEXT,
    similarity FLOAT
) LANGUAGE sql STABLE AS $$
    SELECT
        k.id,
        k.content,
        k.category,
        1 - (k.embedding <=> query_embedding) AS similarity
    FROM knowledge_base k
    WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;

-- Enable RLS on knowledge_base (read-only for authenticated users)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read knowledge base
CREATE POLICY "Knowledge base is readable to all authenticated users"
ON knowledge_base FOR SELECT
USING (true);

-- Policy: Only service role (backend) can insert/update
CREATE POLICY "Only service role can modify knowledge base"
ON knowledge_base FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update knowledge base"
ON knowledge_base FOR UPDATE
USING (false);

-- Grant execute permission on the RPC function to anon and authenticated users
GRANT EXECUTE ON FUNCTION match_knowledge(vector, float, int) TO anon, authenticated;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_base_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_base_updated_at_trigger
BEFORE UPDATE ON knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_base_timestamp();

-- Add AI message support in chat_messages table (for AI responses)
ALTER TABLE chat_messages 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update chat_messages sender_type constraint to include 'ai' type
ALTER TABLE chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_sender_type_check 
    CHECK (sender_type IN ('customer', 'admin', 'ai'));

-- Add is_ai_active column to support_chats if it doesn't exist
ALTER TABLE support_chats
    ADD COLUMN IF NOT EXISTS is_ai_active BOOLEAN DEFAULT true;

-- Add metadata column to support_chats for storing chat metadata
ALTER TABLE support_chats
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON TABLE knowledge_base IS 'Stores restaurant knowledge chunks with vector embeddings for RAG-based AI chat';
COMMENT ON FUNCTION match_knowledge IS 'Performs semantic search on knowledge base using vector similarity (cosine distance)';
