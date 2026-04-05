# RAG Analysis — TastyBytes AI Chatbot

> **Project:** TastyBytes Version 3 (ChatBot)
> **Stack:** React + Supabase Edge Functions (Deno) + Gemini API + pgvector
> **Date:** March 2026

---

## 1. What is RAG and Why is it Used?

**RAG (Retrieval Augmented Generation)** is a technique that combines two AI capabilities:

1. **Retrieval** — Search a knowledge base for documents relevant to the user's question
2. **Generation** — Feed those documents as context into a Large Language Model (LLM) to generate a grounded answer

### Why RAG Exists

A vanilla LLM (like Gemini or GPT-4) has two fundamental limitations for business use:

| Problem | What Happens Without RAG |
|---------|--------------------------|
| **Knowledge cutoff** | The model knows nothing about your specific restaurant — your menu, prices, hours, policies |
| **Hallucination** | Without constraints, the model will confidently make up answers ("Our biryani is ₹250" when it's actually ₹299) |
| **No private data** | You can't train the model on your internal data every time it changes |

RAG solves this by **injecting your own data at query time** into the prompt, so the model answers from your facts, not its imagination.

```
Without RAG:  User Query → LLM → Hallucinated answer
With RAG:     User Query → Search your KB → Relevant facts + Query → LLM → Grounded answer
```

---

## 2. What Problem is RAG Solving in This Project?

### Short Answer: A Real Problem, But Partially Solved

RAG is **legitimately needed** here — the AI needs to answer questions about TastyBytes' specific menu, prices, hours, and policies. Without RAG, Gemini would either refuse ("I don't know your menu") or hallucinate restaurant-specific details.

### What It's Actually Doing

The knowledge base has **26 manually seeded entries** stored in Supabase:

| Category | Count | Example |
|----------|-------|---------|
| `menu` | 14 | "Menu Item: Margherita Pizza... Price: ₹349" |
| `faq` | 6 | "Q: How can I track my order? A: ..." |
| `general` | 1 | "TastyBytes is a restaurant that serves..." |
| `hours` | 1 | "Monday to Friday: 11:00 AM – 10:00 PM..." |
| `payment` | 1 | "We accept Cash, Credit/Debit Cards, UPI..." |
| `policy` | 2 | "Cancellation within 5 minutes..." |
| `service` | 1 | "We offer both dine-in and takeaway..." |

### The Critical Problem: Static KB vs Live Database

The knowledge base is **manually seeded and frozen in time**. The actual `menu_items` table has **20 live items** — but the KB only has 13 individual item entries, and they were written by hand on `2026-02-21`.

**This means:**
- If a menu item price changes in the DB → KB still shows the old price
- If a new dish is added → AI doesn't know about it
- If an item becomes unavailable → AI still says "Currently available"
- The `menu_items` table and `knowledge_base` table are **completely disconnected**

### Verdict

RAG is **solving a real problem** (restaurant-specific knowledge), but the implementation is **half-done** — it works for static FAQs but is brittle for anything that changes (menu, prices, availability).

---

## 3. How RAG is Implemented in This Project

### Architecture Overview

```
Customer Message
      │
      ▼
┌─────────────────────────────────────────────┐
│  supabase/functions/ai-chat/index.ts         │
│                                             │
│  1. getEmbedding(message)                   │
│     └─ POST → Gemini embedding-001 API      │
│     └─ Returns: 768-dimension float vector  │
│                                             │
│  2. searchKnowledge(vector)                 │
│     └─ Supabase RPC: match_knowledge()      │
│     └─ pgvector cosine similarity search    │
│     └─ threshold: 0.3 | top-k: 5           │
│                                             │
│  3. generateResponse(message, top5docs)     │
│     └─ POST → Gemini 2.0-flash-lite API    │
│     └─ SYSTEM_PROMPT + context + question  │
│     └─ temp: 0.3 | maxTokens: 300          │
└─────────────────────────────────────────────┘
      │
      ▼
   AI Response saved to chat_messages table
```

### Step 1 — Embedding the Query

```typescript
// File: supabase/functions/ai-chat/index.ts:61-83
async function getEmbedding(text: string): Promise<number[]> {
    const response = await fetchWithRetry(GEMINI_EMBED_URL, {
        body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] },
            outputDimensionality: 768,  // 768-dimensional vector
        }),
    });
    return data.embedding.values;  // array of 768 floats
}
```

The user's message is converted into a 768-dimensional vector that captures its semantic meaning.

### Step 2 — Vector Similarity Search

```typescript
// File: supabase/functions/ai-chat/index.ts:86-104
const { data } = await supabase.rpc("match_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,   // minimum similarity score (0-1)
    match_count: 5,          // return top 5 results
});
```

Supabase runs a `pgvector` similarity search comparing the query vector against all 26 stored embeddings. The top 5 most semantically similar knowledge chunks are returned.

### Step 3 — Grounded Generation

```typescript
// File: supabase/functions/ai-chat/index.ts:107-141
const contextText = context.map((c, i) => `${i + 1}. ${c}`).join("\n");

// Prompt structure:
// SYSTEM_PROMPT + contextText + "\n\nCustomer question: " + userMessage
```

The system prompt strictly instructs Gemini:
- **Only** answer from the provided context
- If not found in context → suggest escalating to human support
- Keep answers under 3 sentences
- Never reveal the RAG system exists

### What's in the Database

```
knowledge_base table (26 rows):
├── id          UUID
├── content     TEXT       ← the actual knowledge chunk
├── category    TEXT       ← menu / faq / hours / payment / policy / service / general
├── embedding   vector(768) ← pre-computed by Gemini at seed time
└── metadata    JSONB      ← { source: "menu_items" | "faq" | "restaurant_info" }
```

---

## 4. Gemini Free API Key — Cost & Efficiency Analysis

### Current API Call Pattern

Every single customer message triggers **exactly 2 Gemini API calls**:

```
Message: "hi" → 1 embedding call + 1 generation call
Message: "what is your menu?" → 1 embedding call + 1 generation call
Message: "ok thanks" → 1 embedding call + 1 generation call
Message: "yes" → 1 embedding call + 1 generation call
```

There is **no logic to skip API calls** for simple or irrelevant messages.

### Problem 1: No Conversation Context

The code passes only the **current message** to the LLM — zero chat history:

```typescript
// supabase/functions/ai-chat/index.ts:120-125
contents: [
    {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}${contextText}\n\nCustomer question: ${userMessage}` }],
        // ^^^ Only the current message. No prior turns. No "user said X, AI replied Y"
    },
],
```

**What this means:**
- Customer: "What's the price of biryani?" → AI: "₹299"
- Customer: "Is it vegetarian?" → AI has NO idea "it" refers to biryani → may give a wrong answer
- Every reply is answered in isolation — multi-turn conversation is broken

### Problem 2: Embedding Every Message (Even Trivial Ones)

A "yes", "ok", "thanks", or "bye" message still fires an embedding API call and a knowledge search. The context returned will be meaningless, and the generation call will still happen.

### Problem 3: No Response Caching

Common questions like "What are your hours?" will be asked repeatedly. Each time:
- New embedding computed (same question → same vector every time)
- Same 5 KB entries retrieved
- Same response generated

None of this is cached. Every request is treated as completely fresh.

### Problem 4: Knowledge Base Is Stale by Design

The KB entries were manually seeded once. The `embedding` column was computed at seed time. If you update the `content` of a KB row without re-running the embedding, the vector no longer matches the text — searches silently return wrong results.

### Gemini Free Tier Limits (as of 2026)

| Model | Free Tier Limit | Paid Rate |
|-------|----------------|-----------|
| `gemini-embedding-001` | 1,500 requests/day | $0.00025/1K tokens |
| `gemini-2.0-flash-lite` | 1,500 requests/day | $0.075/1M input tokens |

With **2 calls per message**, the free tier allows roughly **750 customer messages per day** before hitting rate limits. The retry logic (2s, 4s backoff on 429) means rate-limited customers wait up to 6 seconds before getting an error.

### Problem 5: No Fallback Knowledge for Unknown Answers

When the similarity search returns no results (score below 0.3), the generation prompt says:
```
"No relevant information found in our knowledge base."
```
Gemini then sees this and typically responds with the human-escalation message. There's no fallback to try a broader search or a different retrieval strategy.

### Summary of Inefficiencies

| Issue | Impact |
|-------|--------|
| 2 API calls per message (including trivial ones) | Wastes free quota fast |
| No conversation history in LLM prompt | Broken multi-turn dialogue |
| No caching of embeddings or responses | Redundant API calls for same questions |
| Static knowledge base not synced with DB | Stale menu data |
| No query intent detection | Can't skip RAG for greetings/off-topic |
| Retry adds 2-6s latency on rate limits | Poor user experience |

---

## 5. How RAG Should Properly Be Implemented

### The Target Architecture

```
Customer Message
      │
      ▼
┌─────────────── Intent & Routing ─────────────────┐
│  Is this a greeting / off-topic / chitchat?      │
│  → YES: Skip RAG entirely, use chat history only │
│  → NO:  Continue to retrieval                    │
└──────────────────────────────────────────────────┘
      │
      ▼
┌─────────────── Hybrid Retrieval ─────────────────┐
│  1. Semantic search   (pgvector cosine sim)      │
│  2. Keyword search    (PostgreSQL full-text)     │
│  Combined: RRF (Reciprocal Rank Fusion)          │
│  Result: Top 5-8 most relevant chunks            │
└──────────────────────────────────────────────────┘
      │
      ▼
┌─────────────── Context Window Builder ───────────┐
│  - Recent 5 turns of conversation history        │
│  - Retrieved knowledge chunks                    │
│  - Current order context (order_id, items, status│
└──────────────────────────────────────────────────┘
      │
      ▼
┌─────────────── LLM Generation ───────────────────┐
│  - Multi-turn messages array (not single prompt) │
│  - Cache at edge for repeated questions          │
└──────────────────────────────────────────────────┘
```

---

### Fix 1: Sync Knowledge Base with Live Database

The biggest issue. The knowledge base should be auto-updated when `menu_items` changes.

**Option A — Database Trigger + Edge Function**

Create a Supabase database trigger that fires on `menu_items` INSERT/UPDATE/DELETE and calls an edge function to re-embed and update the corresponding KB row.

```sql
-- Migration: auto-sync menu_items into knowledge_base
CREATE OR REPLACE FUNCTION sync_menu_to_knowledge_base()
RETURNS trigger AS $$
BEGIN
  -- Delete old KB entry for this menu item
  DELETE FROM knowledge_base
  WHERE metadata->>'menu_item_id' = NEW.id::text;

  -- Insert new entry (embedding will be computed by edge function)
  INSERT INTO knowledge_base (content, category, metadata)
  VALUES (
    format(
      'Menu Item: %s. %s. Price: ₹%s. Category: %s. %s.',
      NEW.name,
      NEW.description,
      NEW.price,
      NEW.category,
      CASE WHEN NEW.is_available THEN 'Currently available' ELSE 'Currently unavailable' END
    ),
    'menu',
    jsonb_build_object('source', 'menu_items', 'menu_item_id', NEW.id)
  );

  -- Notify edge function to compute embedding for the new row
  PERFORM pg_notify('kb_needs_embedding', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_items_sync
AFTER INSERT OR UPDATE OR DELETE ON menu_items
FOR EACH ROW EXECUTE FUNCTION sync_menu_to_knowledge_base();
```

**Option B — Scheduled Re-sync (simpler)**

A cron job (Supabase scheduled function) that runs every hour and re-syncs all menu items into the knowledge base, re-computing embeddings for changed rows only.

---

### Fix 2: Add Conversation History to LLM Prompt

Pass the last N messages as a proper multi-turn conversation:

```typescript
// Fetch last 5 messages from chat_messages table
const { data: history } = await supabase
    .from("chat_messages")
    .select("sender_type, content")
    .eq("chat_id", activeChatId)
    .order("sent_at", { ascending: false })
    .limit(5);

const conversationHistory = (history || []).reverse().map(msg => ({
    role: msg.sender_type === "customer" ? "user" : "model",
    parts: [{ text: msg.content }],
}));

// Build multi-turn contents array
const contents = [
    // System context as first user turn
    { role: "user", parts: [{ text: `${SYSTEM_PROMPT}${contextText}` }] },
    { role: "model", parts: [{ text: "Understood. I'll help customers using only this context." }] },
    // Conversation history
    ...conversationHistory,
    // Current question
    { role: "user", parts: [{ text: userMessage }] },
];
```

---

### Fix 3: Hybrid Search (Semantic + Keyword)

Add a full-text search column and combine results:

```sql
-- Add full-text search to knowledge_base
ALTER TABLE knowledge_base ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX knowledge_base_fts_idx ON knowledge_base USING gin(fts);

-- Hybrid search function
CREATE OR REPLACE FUNCTION match_knowledge_hybrid(
    query_text text,
    query_embedding vector(768),
    match_count int DEFAULT 5
)
RETURNS TABLE(id uuid, content text, category text, score float)
AS $$
    -- Semantic results
    WITH semantic AS (
        SELECT id, content, category,
               1 - (embedding <=> query_embedding) AS score,
               ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) AS rank
        FROM knowledge_base
        WHERE 1 - (embedding <=> query_embedding) > 0.3
        LIMIT 10
    ),
    -- Keyword results
    keyword AS (
        SELECT id, content, category,
               ts_rank(fts, plainto_tsquery('english', query_text)) AS score,
               ROW_NUMBER() OVER (ORDER BY ts_rank(fts, plainto_tsquery('english', query_text)) DESC) AS rank
        FROM knowledge_base
        WHERE fts @@ plainto_tsquery('english', query_text)
        LIMIT 10
    ),
    -- Reciprocal Rank Fusion
    combined AS (
        SELECT COALESCE(s.id, k.id) AS id,
               COALESCE(s.content, k.content) AS content,
               COALESCE(s.category, k.category) AS category,
               COALESCE(1.0 / (60 + s.rank), 0) + COALESCE(1.0 / (60 + k.rank), 0) AS rrf_score
        FROM semantic s FULL OUTER JOIN keyword k ON s.id = k.id
    )
    SELECT id, content, category, rrf_score AS score
    FROM combined
    ORDER BY rrf_score DESC
    LIMIT match_count;
$$ LANGUAGE sql;
```

---

### Fix 4: Cache Embeddings and Responses

```typescript
// Simple in-memory cache within the Edge Function (lives for function lifetime)
const embeddingCache = new Map<string, number[]>();
const responseCache = new Map<string, { response: string; ts: number }>();
const RESPONSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getEmbeddingCached(text: string): Promise<number[]> {
    const normalized = text.trim().toLowerCase();
    if (embeddingCache.has(normalized)) {
        return embeddingCache.get(normalized)!;
    }
    const embedding = await getEmbedding(text);
    embeddingCache.set(normalized, embedding);
    return embedding;
}

async function generateResponseCached(message: string, context: string[]): Promise<string> {
    const cacheKey = `${message}::${context.join("|")}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < RESPONSE_CACHE_TTL) {
        return cached.response;
    }
    const response = await generateResponse(message, context);
    responseCache.set(cacheKey, { response, ts: Date.now() });
    return response;
}
```

---

### Fix 5: Skip RAG for Trivial Messages

```typescript
const TRIVIAL_PATTERNS = /^(hi|hello|hey|ok|okay|thanks|thank you|bye|goodbye|yes|no|sure|alright)[\s!.]*$/i;

// In the main handler:
let aiResponse: string;

if (TRIVIAL_PATTERNS.test(message.trim())) {
    // Skip embedding + search, just respond with Gemini using chat history only
    aiResponse = await generateResponseWithHistory(message, [], conversationHistory);
} else {
    // Full RAG pipeline
    const queryEmbedding = await getEmbeddingCached(message);
    const context = await searchKnowledge(queryEmbedding);
    aiResponse = await generateResponseCached(message, context);
}
```

---

### Fix 6: Order-Context Aware RAG

Currently, the system receives `orderId` but **never uses it** in the knowledge retrieval or prompt. The customer's actual order details (items, status, price) are never injected.

```typescript
// Fetch live order context and inject into prompt
if (orderId) {
    const { data: order } = await supabase
        .from("orders")
        .select("status, total_amount, order_type, created_at, order_items(name, quantity, price)")
        .eq("id", orderId)
        .single();

    if (order) {
        const orderContext = `
Customer's current order:
- Status: ${order.status}
- Total: ₹${order.total_amount}
- Items: ${order.order_items.map(i => `${i.quantity}x ${i.name} (₹${i.price})`).join(", ")}
- Placed at: ${new Date(order.created_at).toLocaleTimeString()}
`;
        // Prepend to context before LLM generation
        context.unshift(orderContext);
    }
}
```

---

### Proper Pipeline Summary

| Component | Current | Should Be |
|-----------|---------|-----------|
| Knowledge base | 26 static entries, manually seeded | Auto-synced from `menu_items` via DB trigger |
| Retrieval | Semantic search only | Hybrid: semantic + full-text (RRF) |
| Conversation | Single-turn (current message only) | Multi-turn (last 5 messages as history) |
| Caching | None | Embedding cache + response cache (5 min TTL) |
| Trivial messages | 2 API calls for "ok" / "hi" | Pattern-matched, skip RAG entirely |
| Order context | `orderId` received but never used | Injected as live context from DB |
| KB freshness | Never updated | Trigger on `menu_items` change |
| Search threshold | Hard-coded `0.3` | Dynamic (lower for short queries, higher for long) |
| Fallback | One fixed message | Tiered: broader search → general answer → escalate |

---

## Quick Reference: Key Files

| File | Role |
|------|------|
| [supabase/functions/ai-chat/index.ts](supabase/functions/ai-chat/index.ts) | Entire RAG pipeline (embed → search → generate) |
| [src/hooks/useAiChat.ts](src/hooks/useAiChat.ts) | Frontend: sends messages, handles rate limit errors |
| [src/components/chat/SupportChatModal.tsx](src/components/chat/SupportChatModal.tsx) | UI: AI chat + human escalation modal |

**Supabase tables involved:**
- `knowledge_base` — 26 rows, vector(768), manually seeded
- `chat_messages` — conversation history (not currently used in LLM prompt)
- `support_chats` — chat sessions with `is_ai_active` flag
- `menu_items` — 20 live items, **disconnected from knowledge_base**
