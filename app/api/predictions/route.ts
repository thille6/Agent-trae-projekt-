import { getPredictionResponse } from "@/lib/predictions";

export async function GET() {
  const payload = await getPredictionResponse();

  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
