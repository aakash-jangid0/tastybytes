/**
 * Seed Knowledge Base Script
 * 
 * Populates the Supabase `knowledge_base` table with restaurant data
 * and generates Gemini embeddings for RAG-based AI chat.
 * 
 * Usage: npx tsx src/scripts/seed-knowledge-base.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// ─── Config ─────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Types ──────────────────────────────────────────────────
interface KnowledgeChunk {
    content: string;
    category: string;
    metadata: Record<string, unknown>;
}

// ─── Step 1: Build knowledge chunks ────────────────────────
async function buildKnowledgeChunks(): Promise<KnowledgeChunk[]> {
    const chunks: KnowledgeChunk[] = [];

    // --- Menu Items (from database) ---
    const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('name, price, description, category, is_available');

    if (error) throw new Error(`Failed to fetch menu items: ${error.message}`);

    for (const item of menuItems || []) {
        const desc = (item.description || '').trim();
        chunks.push({
            content: `Menu Item: ${item.name}. ${desc}. Price: ₹${item.price}. Category: ${item.category}. ${item.is_available ? 'Currently available.' : 'Currently unavailable.'}`,
            category: 'menu',
            metadata: { source: 'menu_items', item_name: item.name },
        });
    }

    // --- Restaurant Info ---
    const restaurantInfo: KnowledgeChunk[] = [
        {
            content: 'TastyBytes is a restaurant that serves a variety of Indian and international cuisines. We offer dine-in, takeaway, and online ordering services.',
            category: 'general',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'Our opening hours are: Monday to Friday: 11:00 AM – 10:00 PM, Saturday: 11:00 AM – 11:00 PM, Sunday: 12:00 PM – 9:00 PM.',
            category: 'hours',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'We accept Cash, Credit/Debit Cards, UPI, and Razorpay online payments. All prices include applicable taxes.',
            category: 'payment',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'For order cancellations, please contact us within 5 minutes of placing the order. Once the order is being prepared, cancellations are not possible.',
            category: 'policy',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'If you have any food allergies, please inform us before placing your order. We take dietary restrictions seriously and can customize most dishes.',
            category: 'policy',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'Our vegetarian options include Palak Paneer, Vegetable Biryani, Masala Dosa, Margherita Pizza, Caesar Salad, and Garlic Bread.',
            category: 'menu',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'We offer both dine-in and takeaway services. For dine-in, tables are assigned on a first-come-first-served basis. You can also order online through our website.',
            category: 'service',
            metadata: { source: 'restaurant_info' },
        },
        {
            content: 'Our most popular dishes are Margherita Pizza (₹349), Chicken Tikka (₹349), and Vegetable Biryani (₹299).',
            category: 'menu',
            metadata: { source: 'restaurant_info' },
        },
    ];
    chunks.push(...restaurantInfo);

    // --- FAQs ---
    const faqs: KnowledgeChunk[] = [
        {
            content: 'Q: How can I track my order? A: Once your order is confirmed, you can track it in real-time on our Order Tracking page. You will see status updates like Pending, Preparing, Ready, and Delivered.',
            category: 'faq',
            metadata: { source: 'faq' },
        },
        {
            content: 'Q: Can I modify my order after placing it? A: Unfortunately, once an order is confirmed and being prepared, modifications are not possible. Please double-check your order before confirming.',
            category: 'faq',
            metadata: { source: 'faq' },
        },
        {
            content: 'Q: Do you have a loyalty program? A: Yes! We have a loyalty program where you earn 1 point per rupee spent. Tiers include Bronze, Silver, Gold, and Platinum with increasing benefits.',
            category: 'faq',
            metadata: { source: 'faq' },
        },
        {
            content: 'Q: How do I apply a coupon code? A: During checkout, enter your coupon code in the promo code field. The discount will be applied automatically if the code is valid and meets minimum order requirements.',
            category: 'faq',
            metadata: { source: 'faq' },
        },
        {
            content: 'Q: What if I receive the wrong order? A: Please contact our support team immediately through the chat. We will arrange a replacement or refund as quickly as possible.',
            category: 'faq',
            metadata: { source: 'faq' },
        },
        {
            content: 'Q: How long does food preparation take? A: Most orders are prepared within 15-30 minutes depending on the items and current order volume. You can see the estimated time on the order tracking page.',
            category: 'faq',
            metadata: { source: 'faq' },
        },
    ];
    chunks.push(...faqs);

    return chunks;
}

// ─── Step 2: Generate embedding via Gemini ─────────────────
async function getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(GEMINI_EMBED_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/gemini-embedding-001',
            content: { parts: [{ text }] },
            outputDimensionality: 768,  // Match our vector(768) column
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini embedding API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

// ─── Step 3: Seed everything ───────────────────────────────
async function seed() {
    console.log('🚀 Starting knowledge base seeding...\n');

    // Clear existing data
    const { error: deleteError } = await supabase
        .from('knowledge_base')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    if (deleteError) {
        console.warn('⚠️  Could not clear existing data:', deleteError.message);
    } else {
        console.log('🗑️  Cleared existing knowledge base data');
    }

    const chunks = await buildKnowledgeChunks();
    console.log(`📦 Built ${chunks.length} knowledge chunks\n`);

    let successCount = 0;
    let failCount = 0;

    for (const chunk of chunks) {
        try {
            // Rate-limit: Gemini free tier allows ~1500 requests/min
            await new Promise((r) => setTimeout(r, 200));

            const embedding = await getEmbedding(chunk.content);

            const { error: insertError } = await supabase
                .from('knowledge_base')
                .insert({
                    content: chunk.content,
                    category: chunk.category,
                    embedding: embedding,
                    metadata: chunk.metadata,
                });

            if (insertError) {
                console.error(`❌ Failed to insert: "${chunk.content.slice(0, 50)}..." → ${insertError.message}`);
                failCount++;
            } else {
                console.log(`✅ Seeded: "${chunk.content.slice(0, 60)}..."`);
                successCount++;
            }
        } catch (err) {
            console.error(`❌ Error processing: "${chunk.content.slice(0, 50)}..."`, err);
            failCount++;
        }
    }

    console.log(`\n🎉 Done! ${successCount} seeded, ${failCount} failed out of ${chunks.length} total.`);
}

seed().catch(console.error);
