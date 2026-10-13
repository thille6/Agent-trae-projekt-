'use client';

import { useState } from "react";

import { DetailDrawer } from "@/components/detail-drawer";
import { MatchCard } from "@/components/match-card";
import type { MatchRecord } from "@/lib/types";

interface DesignCardPreviewProps {
  match: MatchRecord;
}

export function DesignCardPreview({ match }: DesignCardPreviewProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

  return (
    <>
      <MatchCard match={match} onOpen={setSelectedMatch} />
      <DetailDrawer
        isOpen={selectedMatch !== null}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}
