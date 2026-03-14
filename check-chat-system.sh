#!/bin/bash
# TastyBytes AI Chat System - Setup and Troubleshooting Guide
# This script helps diagnose and resolve issues with the support chat and AI chat systems

echo "=================================="
echo "TastyBytes Chat System Status Check"
echo "=================================="
echo ""

# 1. Check if required edge function files exist
echo "1️⃣ Checking Edge Function files..."
if [ -f "supabase/functions/ai-chat/index.ts" ]; then
    echo "✅ AI Chat edge function found"
else
    echo "❌ AI Chat edge function missing"
fi

# 2. Check if migration files exist
echo ""
echo "2️⃣ Checking migration files..."
if [ -f "supabase/migrations/20250909_setup_knowledge_base_rag.sql" ]; then
    echo "✅ Knowledge base migration found"
else
    echo "⚠️ Knowledge base migration not found - run: npm run migrate:create"
fi

# 3. Check Netlify function
echo ""
echo "3️⃣ Checking Netlify Functions..."
if [ -f "netlify/functions/support-chat.js" ]; then
    echo "✅ Netlify support-chat function found"
else
    echo "❌ Netlify support-chat function missing"
fi

# 4. Check environment variables
echo ""
echo "4️⃣ Checking environment variables..."
if grep -q "GEMINI_API_KEY" .env.local 2>/dev/null || grep -q "GEMINI_API_KEY" .env 2>/dev/null; then
    echo "✅ GEMINI_API_KEY configured"
else
    echo "❌ GEMINI_API_KEY missing - required for AI responses"
fi

if grep -q "SUPABASE_URL" .env.local 2>/dev/null || grep -q "SUPABASE_URL" .env 2>/dev/null; then
    echo "✅ SUPABASE_URL configured"
else
    echo "❌ SUPABASE_URL missing"
fi

if grep -q "SUPABASE_ANON_KEY" .env.local 2>/dev/null || grep -q "SUPABASE_ANON_KEY" .env 2>/dev/null; then
    echo "✅ SUPABASE_ANON_KEY configured"
else
    echo "❌ SUPABASE_ANON_KEY missing"
fi

echo ""
echo "=================================="
echo "Quick Fixes to Try:"
echo "=================================="
echo ""
echo "1. Deploy the new knowledge base migration:"
echo "   npx supabase db push"
echo ""
echo "2. Seed the knowledge base with content:"
echo "   npm run seed:knowledge"
echo ""
echo "3. Redeploy the Netlify functions:"
echo "   npx netlify deploy --prod"
echo ""
echo "4. Redeploy the Supabase edge functions:"
echo "   npx supabase functions deploy ai-chat"
echo ""
echo "5. Clear browser cache and retry:"
echo "   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "   - Clear localStorage in DevTools → Application → Storage"
echo ""
