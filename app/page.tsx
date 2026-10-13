import { connection } from "next/server";

import { PredictionDashboard } from "@/components/prediction-dashboard";
import { getPredictionResponse } from "@/lib/predictions";

export default async function Home() {
  await connection();
  const response = await getPredictionResponse();

  return (
    <main className="min-h-screen bg-background">
      <PredictionDashboard
        generatedAt={response.generatedAt}
        matches={response.matches}
        partial={response.partial}
        stale={response.stale}
        warnings={response.warnings}
      />
    </main>
  );
}
