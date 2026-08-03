export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const backendUrl =
    process.env.BACKEND_URL || "https://faceai-api.railway.app";

  // Ekstrak path dari URL
  const url = new URL(req.url);
  const path = url.pathname.replace("/api/history", "/api/history");

  const response = await fetch(`${backendUrl}${path}${url.search}`, {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
