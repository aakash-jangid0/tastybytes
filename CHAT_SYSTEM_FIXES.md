# TastyBytes Chat System - Troubleshooting & Setup Guide

## Current Issues Identified

### 1. **500 Error: "Failed to process your message"** (AI Chat Function)
**Root Cause:** The Supabase Edge Function `ai-chat` is failing with a 500 error

**What's happening:**
- User opens support chat modal and tries to send a message
- The POST request to `/functions/v1/ai-chat` returns HTTP 500
- Error message: "Failed to process your message. Please try again."

**Why it's failing:**
- Missing `match_knowledge` RPC function (doesn't exist in database)
- Missing `knowledge_base` table with vector embeddings
- Missing `pgvector` extension for vector similarity search
- Environment variables may not be properly set in Supabase

### 2. **Chat History Fails to Load**
**Root Cause:** Issues with the Netlify function or customer lookup

**Error:** "Failed to load chat history"

**What's happening:**
- SupportChatModal opens but shows error state
- `useSupportChat` hook can't retrieve chat history
- Netlify function at `/.netlify/functions/support-chat` may be failing

## Solutions Applied

### ✅ Migration Created: `20250909_setup_knowledge_base_rag.sql`

This migration sets up the complete RAG (Retrieval-Augmented Generation) system:

```sql
-- Enables pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Creates knowledge_base table with:
-- - content: Text snippets from restaurant knowledge
-- - embedding: Vector representation (768 dimensions from Gemini)
-- - category: Classification (menu, hours, policy, etc.)
-- - metadata: JSONB for flexible data storage

CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    embedding vector(768),  -- Gemini embedding
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Creates match_knowledge() RPC function for semantic search
-- This function searches knowledge base using vector similarity
CREATE FUNCTION match_knowledge(
    query_embedding vector,
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
) RETURNS TABLE (...)
```

### ✅ Edge Function Improved: `supabase/functions/ai-chat/index.ts`

Changes made:
1. **Better environment validation** - Checks for all required env vars upfront
2. **Graceful error handling** - Returns detailed error messages instead of crashing
3. **Non-blocking failures** - Chat creation and message saving won't crash if they fail
4. **Better logging** - Console errors show exactly what's missing

## Required Setup Steps

### Step 1: Deploy the Migration
```bash
# Push migration to Supabase
npx supabase db push
```

This creates:
- ✅ `pgvector` extension
- ✅ `knowledge_base` table with indexes
- ✅ `match_knowledge()` RPC function
- ✅ RLS policies for knowledge base
- ✅ Support for AI messages in chat_messages table
- ✅ `is_ai_active` and `metadata` columns in support_chats

### Step 2: Seed Knowledge Base (Optional but Recommended)
```bash
# Populate knowledge base with restaurant info and embeddings
npm run seed:knowledge
```

This adds content like:
- Menu items from your database
- Restaurant hours and policies
- FAQs and common questions
- Payment and delivery information

### Step 3: Verify Supabase Environment Variables

In your Supabase dashboard, go to **Project Settings → API** and ensure these are set:

**In Edge Function secrets:**
```
GEMINI_API_KEY=<your-gemini-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 4: Redeploy Everything

```bash
# Option 1: Deploy locally
npx supabase functions deploy ai-chat

# Option 2: Deploy via Netlify
npx netlify deploy --prod

# Option 3: Deploy both
npm run deploy:functions
```

### Step 5: Test the System

```javascript
// Test in browser console
fetch('/.netlify/functions/support-chat?health=true')
  .then(r => r.json())
  .then(data => console.log('Status:', data.status))

// Test AI chat
const testMessage = {
  message: "What are your opening hours?",
  customerId: "test-customer-id",
  orderId: "test-order-id"
};

fetch('https://your-supabase-url/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify(testMessage)
})
.then(r => r.json())
.then(data => console.log('AI Response:', data))
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| 500 (AI Chat) | Missing RPC function | Run Step 1 migration |
| "Failed to load chat history" | Netlify function error | Check Netlify logs |
| "Function not found" | Edge function not deployed | Run `npx supabase functions deploy` |
| "Missing environment variables" | Secrets not set | Add to Supabase project settings |
| "Bearer token invalid" | Auth issue | Check Supabase ANON_KEY |

## Database Schema Changes

### New Tables
- `knowledge_base` - Stores knowledge chunks with vector embeddings

### Modified Columns
- `support_chats.is_ai_active` (BOOLEAN) - Tracks if chat is in AI mode
- `support_chats.metadata` (JSONB) - Flexible metadata storage
- `chat_messages.metadata` (JSONB) - Message metadata
- `chat_messages.sender_type` - Now includes 'ai' type

### New Functions
- `match_knowledge(query_embedding, match_threshold, match_count)` - Vector similarity search

### New RLS Policies
- Knowledge base is readable by all authenticated users
- Only service role can modify knowledge base

## Debugging Tips

### 1. Check Supabase Logs
```bash
npx supabase functions list
npx supabase functions logs ai-chat
```

### 2. Monitor Network Requests
- Open DevTools → Network tab
- Filter by `/functions/v1/ai-chat`
- Check request/response headers and body

### 3. Check Browser Console
Look for messages from:
- `useAiChat.ts:39` - API call status
- `useRealtimeSync.ts:65` - Realtime subscription status
- `SupportChatModal.tsx:164` - Modal initialization

### 4. Test Gemini API Separately
```bash
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"model":"models/gemini-embedding-001","content":{"parts":[{"text":"test message"}]},"outputDimensionality":768}'
```

## File Changes Made

### New Files Created
- `supabase/migrations/20250909_setup_knowledge_base_rag.sql` - RAG system setup

### Files Modified
- `supabase/functions/ai-chat/index.ts` - Better error handling and validation
- `check-chat-system.sh` - Diagnostic script

## Next Steps

1. **Deploy**: Push the migration and edge functions to production
2. **Test**: Verify the AI chat works by sending a test message
3. **Seed**: Populate knowledge base (optional but improves responses)
4. **Monitor**: Check logs for any remaining errors

## Support

If issues persist:
1. Check Supabase Edge Function logs for specific error
2. Verify all environment variables are set
3. Ensure knowledge base table has data (check Supabase dashboard)
4. Test chat independently from the UI using curl/Postman
