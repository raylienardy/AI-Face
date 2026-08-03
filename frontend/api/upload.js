export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const backendUrl =
      process.env.BACKEND_URL || "https://faceai-api.railway.app";

    // Ambil body sebagai ArrayBuffer
    const bodyBuffer = await req.arrayBuffer();

    const response = await fetch(`${backendUrl}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type":
          req.headers.get("content-type") || "application/octet-stream",
      },
      body: bodyBuffer,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Upload proxy error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
