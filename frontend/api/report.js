export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "Missing file parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const backendUrl =
    process.env.BACKEND_URL || "https://faceai-api.railway.app";

  const response = await fetch(`${backendUrl}/api/report?file=${file}`);
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
