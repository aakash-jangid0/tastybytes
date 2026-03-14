# Quick Deployment Checklist

## 🚀 AI Chat System Fix - Step by Step

### Phase 1: Database Setup

- [ ] **Review the new migration**
  - File: `supabase/migrations/20250909_setup_knowledge_base_rag.sql`
  - This creates the knowledge base table and match_knowledge RPC function

- [ ] **Deploy to Supabase**
  ```bash
  npx supabase db push
  ```
  Expected output: Migration applied successfully

- [ ] **Verify in Supabase Dashboard**
  - Go to SQL Editor
  - Run: `SELECT COUNT(*) FROM knowledge_base;`
  - Should return 0 rows (empty table)
  - Run: `SELECT f.routine_name FROM information_schema.routines f WHERE f.routine_name = 'match_knowledge';`
  - Should return one row

### Phase 2: Supabase Edge Function

- [ ] **Check current edge function**
  - File: `supabase/functions/ai-chat/index.ts`
  - Verify error handling improvements are in place

- [ ] **Deploy edge function**
  ```bash
  npx supabase functions deploy ai-chat
  ```

- [ ] **Verify deployment**
  - Check Supabase dashboard → Functions → ai-chat
  - Status should be "Deployed"

### Phase 3: Environment Variables

Required variables in Supabase project settings (Project → Settings → Edge Functions → Secrets):

- [ ] `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] `SUPABASE_URL` - Your Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From API settings

```bash
# To set secrets, use Supabase CLI
npx supabase secrets set GEMINI_API_KEY=<your-key>
npx supabase secrets set SUPABASE_URL=<your-url>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

### Phase 4: Netlify Deployment

- [ ] **Check Netlify function**
  - File: `netlify/functions/support-chat.js`
  - Should support customer lookup and chat creation

- [ ] **Deploy to Netlify**
  ```bash
  npx netlify deploy --prod
  ```

- [ ] **Verify deployment**
  - Test: `https://your-site/.netlify/functions/support-chat?health=true`
  - Should return `{"status":"healthy"}`

### Phase 5: Knowledge Base Setup (Optional)

- [ ] **Check seed script exists**
  - File: `src/scripts/seed-knowledge-base.ts`

- [ ] **Run seeding (if configured)**
  ```bash
  npm run seed:knowledge
  ```
  This populates the knowledge base with:
  - Menu items from your database
  - Restaurant info
  - FAQs
  - Policies

### Phase 6: Testing

#### Local Testing
- [ ] Clear browser cache
  - Hard refresh: Ctrl+Shift+R or Cmd+Shift+R
  - DevTools → Application → Clear storage

- [ ] Test chat modal
  - Open order tracking page
  - Click "Contact Support"
  - Type a message
  - Check browser console for errors

#### Verification Steps
```javascript
// 1. Test Supabase connection
fetch('/.netlify/functions/support-chat?health=true')
  .then(r => r.json())
  .then(console.log)
// Should show: { status: 'healthy' }

// 2. Test knowledge base exists
// (In Supabase dashboard SQL Editor)
SELECT COUNT(*) as knowledge_chunks FROM knowledge_base;
// Should be: 0 (until you seed) or > 0 (after seeding)

// 3. Test RPC function
// (In Supabase dashboard SQL Editor)
SELECT * FROM match_knowledge(
  ARRAY[0.1,0.2,0.3...]::vector(768),
  0.3,
  5
);
// Should return results or empty
```

### Phase 7: Monitoring

- [ ] **Check logs**
  ```bash
  # Supabase edge function logs
  npx supabase functions logs ai-chat
  
  # Netlify function logs
  npx netlify functions:log support-chat
  ```

- [ ] **Monitor errors**
  - Console messages starting with "❌" indicate issues
  - Console messages starting with "✅" indicate success

## 🔴 Still Getting Errors?

### Error: "Failed to process your message"
- [ ] Verify environment variables are set
- [ ] Check Supabase Edge Function logs: `npx supabase functions logs ai-chat`
- [ ] Ensure GEMINI_API_KEY is valid

### Error: "Failed to load chat history"
- [ ] Check Netlify logs: `npx netlify functions:log support-chat`
- [ ] Verify customer exists in database
- [ ] Check if support_chats table has data

### Error: "Function not found"
- [ ] Redeploy edge function: `npx supabase functions deploy ai-chat`
- [ ] Redeploy Netlify: `npx netlify deploy --prod`
- [ ] Clear browser cache completely

### Error: RPC error in console
- [ ] Run migration: `npx supabase db push`
- [ ] Verify migration was successful
- [ ] Check RPC function exists: Query Supabase dashboard

## 📊 Expected Behavior After Fix

✅ **What should work:**
1. User opens support chat → No error loading history
2. User types message → Message appears in chat
3. AI responds with relevant info from knowledge base
4. Chat history persists across refreshes
5. Realtime updates show new messages

❌ **What won't work yet:**
- Knowledge base won't be populated until seeding runs
- AI responses will be generic if knowledge base is empty
- Customer lookup will fail if customer doesn't exist in database

## 🎯 Success Criteria

- [ ] No error messages in browser console
- [ ] Chat modal opens without "Failed to load chat history"
- [ ] Messages can be sent and received
- [ ] AI provides responses (may be generic without seeding)
- [ ] No 500 errors in network tab

---

**Last Updated:** February 21, 2025
**Checklist Version:** 1.0
