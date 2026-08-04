// api/analyze.js
export const config = {
  runtime: "edge",
  maxDuration: 120, // timeout 2 menit untuk 5 percobaan
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

async function tryApiKey(base64Image, mimeType, apiKey, keyIndex) {
  const response = await fetch(
    "https://telkom-ai-dag.api.apilogy.id/LargeMultimodalModel/0.0.2/lmm/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "telkom-ai-vision-instruct",
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
    if (response.status === 429) {
      throw new Error(`RATE_LIMITED`);
    }
    throw new Error(
      `API Error (key ${keyIndex}): ${response.status} - ${errorText.substring(0, 100)}`,
    );
  }

  const data = await response.json();
  // Coba beberapa kemungkinan lokasi hasil
  const content =
    data.choices?.[0]?.message?.content ||
    data.message?.content ||
    data.response;
  if (!content) throw new Error("Unexpected response format");
  return content;
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

    const apiKeys = [
      process.env.TELKOM_API_KEY_1,
      process.env.TELKOM_API_KEY_2,
      process.env.TELKOM_API_KEY_3,
      process.env.TELKOM_API_KEY_4,
      process.env.TELKOM_API_KEY_5,
    ].filter(Boolean);

    if (apiKeys.length === 0) {
      return new Response(JSON.stringify({ error: "No API keys configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let result = null;
    let usedKey = -1;

    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const rawResult = await tryApiKey(
          base64Image,
          mimeType,
          apiKeys[i],
          i + 1,
        );
        result = cleanJson(rawResult);
        usedKey = i + 1;
        break;
      } catch (e) {
        console.error(`Key ${i + 1} failed:`, e.message);
        // Lanjut ke key berikutnya
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({
          error: "Semua API key sedang sibuk. Silakan coba lagi nanti.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    result.provider = `telkom-ai-key-${usedKey}`;
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
