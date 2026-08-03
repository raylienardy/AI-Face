// frontend/api/analyze.js
export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  // Hanya menerima POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Konversi gambar ke base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // Ambil API key dari environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prompt yang sama seperti di backend
    const prompt = `Kamu adalah AI penilai kecantikan wajah yang objektif, profesional, dan etis.
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

    // Panggil Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: file.type || "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(
        `Gemini API error: ${geminiResponse.status} - ${errorText}`,
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0].content.parts[0].text;

    // Bersihkan markdown JSON
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    const analysisResult = JSON.parse(jsonText);

    return new Response(JSON.stringify(analysisResult), {
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
