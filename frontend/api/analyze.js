export const config = {
  runtime: "edge",
};

const PROMPT = `Kamu adalah AI penilai kecantikan wajah yang objektif, profesional, dan etis.
Kamu menerima gambar wajah dan menghasilkan penilaian dalam format JSON.

Prinsip:
- Gunakan bahasa Indonesia yang sopan, membangun, dan tidak menghakimi.
- Fokus pada proporsi, simetri, dan harmoni wajah, bukan standar kecantikan subjektif.
- Berikan saran yang realistis (terkait pencahayaan, ekspresi, gaya rambut), bukan perubahan anatomis.
- Setiap skor harus memiliki confidence yang jujur berdasarkan data yang tersedia.

Format output HARUS JSON dengan struktur berikut:
{
  "overall_score": float (0-100),
  "confidence": float (0-1),
  "summary": string (1-2 kalimat ringkasan kondisi wajah),
  "feature_scores": {
    "eyes": {"score": float, "comment": string},
    "eyebrows": {"score": float, "comment": string},
    "nose": {"score": float, "comment": string},
    "lips": {"score": float, "comment": string},
    "jaw": {"score": float, "comment": string},
    "skin": {"score": float, "comment": string},
    "hair": {"score": float, "comment": string},
    "cheekbones": {"score": float, "comment": string},
    "facial_harmony": {"score": float, "comment": string},
    "facial_symmetry": {"score": float, "comment": string}
  },
  "strengths": [string, ...] (3-5 kekuatan utama),
  "suggestions": [string, ...] (2-4 saran realistis)
}

JANGAN mengembalikan apa pun selain JSON yang valid.`;

async function tryGemini(base64Image, mimeType, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini: ${response.status} - ${errorText.substring(0, 200)}`,
    );
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return cleanJson(text);
}

async function tryGroq(base64Image, mimeType, apiKey) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Groq: ${response.status} - ${errorText.substring(0, 200)}`,
    );
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return cleanJson(text);
}

function cleanJson(text) {
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
  if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
  if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
  jsonText = jsonText.trim();
  return JSON.parse(jsonText);
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    let result = null;
    let usedProvider = "";
    const errors = [];

    // 1. Coba Gemini
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        result = await tryGemini(base64Image, mimeType, geminiKey);
        usedProvider = "gemini";
      } else {
        errors.push("Gemini: API key not set");
      }
    } catch (e) {
      errors.push(e.message);
    }

    // 2. Fallback ke Groq
    if (!result) {
      try {
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
          result = await tryGroq(base64Image, mimeType, groqKey);
          usedProvider = "groq";
        } else {
          errors.push("Groq: API key not set");
        }
      } catch (e) {
        errors.push(e.message);
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({
          error: "Semua AI provider sedang sibuk. Silakan coba lagi nanti.",
          debug: errors,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    result.provider = usedProvider;
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
