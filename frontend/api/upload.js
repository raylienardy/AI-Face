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
    const backendUrl = process.env.BACKEND_URL;

    // DEBUG: Kembalikan informasi environment
    if (!backendUrl) {
      return new Response(
        JSON.stringify({
          error: "BACKEND_URL not set",
          env: Object.keys(process.env).filter((k) => k.includes("BACKEND")),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Ambil body mentah
    const bodyBuffer = await req.arrayBuffer();

    // DEBUG: Cek ukuran body
    const bodySize = bodyBuffer.byteLength;

    const response = await fetch(`${backendUrl}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type":
          req.headers.get("content-type") || "application/octet-stream",
      },
      body: bodyBuffer,
    });

    const responseText = await response.text();

    // DEBUG: Kembalikan response mentah untuk debugging
    return new Response(
      JSON.stringify({
        status: response.status,
        backendResponse: responseText,
        backendUrl: backendUrl,
        bodySize: bodySize,
        contentType: req.headers.get("content-type"),
      }),
      {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
