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
    if (!backendUrl) {
      // Jika tidak ada environment variable, kita tahu sumber masalahnya
      return new Response(JSON.stringify({ error: "BACKEND_URL not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ambil body mentah
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
    // Kembalikan pesan error apa adanya agar terlihat di frontend
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
