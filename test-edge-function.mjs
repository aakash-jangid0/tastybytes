// Test 1.1 — Direct Edge Function API call
// This bypasses the frontend entirely to test if Supabase + Gemini work

const SUPABASE_URL = "https://xeetynafcpofbzpgrsvn.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZXR5bmFmY3BvZmJ6cGdyc3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTA4NzEsImV4cCI6MjA2MTI2Njg3MX0.CBFoP91g402Gag7FvnH7Q0ODYHx-WvolbKB5mVrc40E";

const questions = [
    "What are your restaurant hours?",
    "What's on the menu?",
    "Do you accept UPI?",
    "Do you have vegan options?",
    "Who is Elon Musk?",  // Out-of-scope — should say "I'm not sure"
];

async function testQuestion(question) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📝 Question: "${question}"`);
    console.log(`${"─".repeat(60)}`);

    try {
        const start = Date.now();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ANON_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: question,
                customerId: "00000000-0000-0000-0000-000000000001",
                orderId: "00000000-0000-0000-0000-000000000001",
            }),
        });

        const elapsed = Date.now() - start;
        const data = await res.json();

        if (res.ok && data.success) {
            console.log(`✅ Status: ${res.status} (${elapsed}ms)`);
            console.log(`🤖 AI Response: ${data.response}`);
            console.log(`💬 Chat ID: ${data.chatId}`);
            return { pass: true, question, response: data.response };
        } else {
            console.log(`❌ Status: ${res.status} (${elapsed}ms)`);
            console.log(`Error: ${JSON.stringify(data)}`);
            return { pass: false, question, error: data };
        }
    } catch (err) {
        console.log(`💥 Network Error: ${err.message}`);
        return { pass: false, question, error: err.message };
    }
}

async function runTests() {
    console.log("🧪 LAYER 1: Backend Edge Function Tests");
    console.log("========================================\n");

    const results = [];
    for (const q of questions) {
        results.push(await testQuestion(q));
    }

    console.log(`\n\n${"═".repeat(60)}`);
    console.log("📊 RESULTS SUMMARY");
    console.log(`${"═".repeat(60)}`);
    const passed = results.filter(r => r.pass).length;
    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${results.length - passed}/${results.length}`);

    results.forEach((r, i) => {
        const icon = r.pass ? "✅" : "❌";
        console.log(`  ${icon} Q${i + 1}: "${r.question.slice(0, 40)}..."`);
    });
}

runTests();
