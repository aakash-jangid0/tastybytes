// Test with built-in delay to handle rate limits
const SUPABASE_URL = "https://xeetynafcpofbzpgrsvn.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZXR5bmFmY3BvZmJ6cGdyc3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTA4NzEsImV4cCI6MjA2MTI2Njg3MX0.CBFoP91g402Gag7FvnH7Q0ODYHx-WvolbKB5mVrc40E";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function testQuestion(question, attempt = 1) {
    console.log(`\n📝 Question: "${question}" (attempt ${attempt})`);
    const start = Date.now();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question }),
    });
    const elapsed = Date.now() - start;
    const data = await res.json();

    if (res.ok && data.success) {
        console.log(`✅ SUCCESS (${elapsed}ms)`);
        console.log(`🤖 AI: ${data.response}`);
        return true;
    } else if (data.details?.includes("429") && attempt < 3) {
        console.log(`⏳ Rate limited. Waiting 60s and retrying...`);
        await sleep(60000);
        return testQuestion(question, attempt + 1);
    } else {
        console.log(`❌ FAILED (${res.status}, ${elapsed}ms)`);
        console.log(`Error: ${data.details?.slice(0, 200)}`);
        return false;
    }
}

console.log("🧪 RAG Pipeline Test (with rate-limit retry)\n");
const result = await testQuestion("What are your restaurant hours?");
console.log(`\n${result ? "🎉 LAYER 1 PASSED!" : "💥 LAYER 1 FAILED — check the error above"}`);
