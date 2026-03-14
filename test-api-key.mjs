// Quick test: Is your Gemini API key valid?
const API_KEY = "AIzaSyBKCc9EXoxwzTQ3v8psL595IDvqHpzOf2s";

const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${API_KEY}`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text: "hello" }] },
            outputDimensionality: 768,
        }),
    }
);

const data = await res.json();

if (res.ok && data.embedding) {
    console.log("✅ API KEY IS VALID! Embedding returned", data.embedding.values.length, "dimensions");
} else {
    console.log("❌ API KEY IS INVALID!");
    console.log("Error:", JSON.stringify(data, null, 2));
}
