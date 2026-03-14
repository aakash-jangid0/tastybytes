// @ts-nocheck — Runs in Supabase Deno runtime, not Node.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Environment Validation ────────────────────────────────
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY environment variable");
}
if (!SUPABASE_URL) {
    console.error("❌ Missing SUPABASE_URL environment variable");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const GEMINI_EMBED_URL = GEMINI_API_KEY 
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`
    : null;
const GEMINI_GENERATE_URL = GEMINI_API_KEY
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`
    : null;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ─── Retry helper for rate-limited requests ─────────────────
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(url, options);
        if (response.status === 429 && attempt < maxRetries) {
            const waitMs = Math.pow(2, attempt) * 2000; // 2s, 4s
            console.warn(`Rate limited (attempt ${attempt + 1}), waiting ${waitMs}ms...`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
        }
        return response;
    }
    throw new Error("Max retries exceeded");
}

const SYSTEM_PROMPT = `You are the AI assistant for TastyBytes, a restaurant. Your job is to help customers with questions about our menu, pricing, hours, policies, and services.

Rules:
- ONLY answer from the provided context below. Do NOT make up information.
- If you cannot find the answer in the context, say: "I'm not sure about that. Would you like to talk to one of our support agents for more help?"
- Be friendly, concise, and professional.
- Use ₹ for prices (Indian Rupees).
- Keep answers under 3 sentences unless the customer asks for details.
- Do not reveal that you are using a knowledge base or RAG system.
- You are representing TastyBytes directly. Speak as "we" not "they".

Context from our knowledge base:
`;

// ─── Get embedding for user query ───────────────────────────
async function getEmbedding(text: string): Promise<number[]> {
    if (!GEMINI_EMBED_URL) {
        throw new Error("GEMINI_EMBED_URL not configured - missing GEMINI_API_KEY");
    }
    
    const response = await fetchWithRetry(GEMINI_EMBED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] },
            outputDimensionality: 768,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Embedding error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

// ─── Search knowledge base ─────────────────────────────────
async function searchKnowledge(queryEmbedding: number[]): Promise<string[]> {
    if (!supabase) {
        console.warn("Supabase not initialized, returning empty context");
        return [];
    }

    const { data, error } = await supabase.rpc("match_knowledge", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 5,
    });

    if (error) {
        console.error("Knowledge search error:", error);
        return [];
    }

    return (data || []).map((row: { content: string }) => row.content);
}

// ─── Generate AI response ──────────────────────────────────
async function generateResponse(userMessage: string, context: string[]): Promise<string> {
    if (!GEMINI_GENERATE_URL) {
        throw new Error("GEMINI_GENERATE_URL not configured - missing GEMINI_API_KEY");
    }

    const contextText = context.length > 0
        ? context.map((c, i) => `${i + 1}. ${c}`).join("\n")
        : "No relevant information found in our knowledge base.";

    const response = await fetchWithRetry(GEMINI_GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${SYSTEM_PROMPT}${contextText}\n\nCustomer question: ${userMessage}` }],
                },
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 300,
                topP: 0.8,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Generation error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Would you like to talk to a support agent?";
}

// ─── Save messages to database ─────────────────────────────
async function saveMessage(chatId: string, senderId: string, senderType: string, content: string) {
    const { error } = await supabase.from("chat_messages").insert({
        chat_id: chatId,
        sender_id: senderId,
        sender_type: senderType,
        content: content,
    });

    if (error) {
        console.error("Failed to save message:", error);
    }

    await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", chatId);
}

// ─── Main handler ──────────────────────────────────────────
Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        // ─── Validate environment variables first ───
        if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !supabase) {
            const missingVars = [];
            if (!GEMINI_API_KEY) missingVars.push("GEMINI_API_KEY");
            if (!SUPABASE_URL) missingVars.push("SUPABASE_URL");
            if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
            
            throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
        }

        if (!GEMINI_EMBED_URL || !GEMINI_GENERATE_URL) {
            throw new Error("Failed to configure Gemini API URLs");
        }

        const { message, chatId, customerId, orderId } = await req.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: "Message is required" }),
                { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
        }

        let activeChatId = chatId;

        // If no chatId, try to create a new support chat
        if (!activeChatId && customerId && orderId) {
            try {
                const { data: newChat, error: chatError } = await supabase
                    .from("support_chats")
                    .insert({
                        customer_id: customerId,
                        order_id: orderId,
                        issue: message.slice(0, 100),
                        category: "other",
                        status: "active",
                        is_ai_active: true,
                        metadata: { started_by: "ai_chat" },
                    })
                    .select("id")
                    .single();

                if (chatError) {
                    console.warn("Chat creation failed (non-fatal):", chatError.message);
                } else {
                    activeChatId = newChat.id;
                }
            } catch (e) {
                console.warn("Chat creation error (non-fatal):", e instanceof Error ? e.message : String(e));
            }
        }

        // Save the user's message (only if we have a chat)
        if (activeChatId && customerId) {
            await saveMessage(activeChatId, customerId, "customer", message);
        }

        // ─── RAG Pipeline (always runs, even without a chat) ───
        const queryEmbedding = await getEmbedding(message);
        const context = await searchKnowledge(queryEmbedding);
        const aiResponse = await generateResponse(message, context);

        // Save AI response (only if we have a chat)
        const AI_BOT_ID = "00000000-0000-0000-0000-000000000000";
        if (activeChatId) {
            await saveMessage(activeChatId, AI_BOT_ID, "ai", aiResponse);
        }

        return new Response(
            JSON.stringify({
                success: true,
                chatId: activeChatId,
                response: aiResponse,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (err) {
        console.error("AI Chat Error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return new Response(
            JSON.stringify({
                error: "Failed to process your message. Please try again.",
                details: errorMessage,
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
