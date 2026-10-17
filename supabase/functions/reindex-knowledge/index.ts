// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Runs in Supabase Deno runtime, not Node.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 50;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

function hasServiceRoleAuthorization(authorization: string | null): boolean {
    if (!authorization?.startsWith("Bearer ")) return false;

    const tokenPayload = authorization.slice("Bearer ".length).split(".")[1];
    if (!tokenPayload) return false;

    try {
        const normalizedPayload = tokenPayload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(tokenPayload.length / 4) * 4, "=");
        const claims = JSON.parse(atob(normalizedPayload));
        return claims.role === "service_role";
    } catch {
        return false;
    }
}

async function embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(OPENAI_EMBED_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer ".concat(OPENAI_API_KEY),
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: texts,
            dimensions: EMBEDDING_DIMENSIONS,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI embedding request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const embeddings: number[][] = [];
    for (let index = 0; index < texts.length; index++) {
        const embedding = data.data?.find((item: { index: number }) => item.index === index)?.embedding;
        if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
            throw new Error(`OpenAI returned an invalid embedding for batch item ${index}`);
        }
        embeddings.push(embedding);
    }
    return embeddings;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !supabase) {
        console.error("OPENAI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required");
        return jsonResponse({ error: "Reindexing is not configured" }, 500);
    }

    if (!hasServiceRoleAuthorization(req.headers.get("Authorization"))) {
        return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let processed = 0;
    try {
        for (let offset = 0; ; offset += BATCH_SIZE) {
            const { data: rows, error } = await supabase
                .from("knowledge_base")
                .select("id, content")
                .order("id")
                .range(offset, offset + BATCH_SIZE - 1);

            if (error) throw new Error(`Failed to load knowledge-base rows: ${error.message}`);
            if (!rows?.length) break;

            const embeddings = await embedBatch(rows.map((row: { content: string }) => row.content));
            for (let index = 0; index < rows.length; index++) {
                const { error: updateError } = await supabase
                    .from("knowledge_base")
                    .update({ embedding: JSON.stringify(embeddings[index]) })
                    .eq("id", rows[index].id);

                if (updateError) {
                    throw new Error(`Failed to update knowledge-base row ${rows[index].id}: ${updateError.message}`);
                }
                processed++;
            }

            if (rows.length < BATCH_SIZE) break;
        }

        return jsonResponse({ success: true, processed, model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS });
    } catch (error) {
        console.error("Knowledge-base reindex failed:", error);
        return jsonResponse({
            error: error instanceof Error ? error.message : String(error),
            processed,
        }, 500);
    }
});
