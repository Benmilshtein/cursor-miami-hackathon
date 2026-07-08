"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type TrackId = "beginner";

type TrackContextValue = {
  track: TrackId;
  setTrack: (track: TrackId) => void;
};

const TrackContext = createContext<TrackContextValue | null>(null);

export function TrackProvider({
  children,
  defaultTrack = "beginner",
}: {
  children: ReactNode;
  defaultTrack?: TrackId;
}) {
  const [track, setTrack] = useState<TrackId>(defaultTrack);
  return (
    <TrackContext.Provider value={{ track, setTrack }}>
      {children}
    </TrackContext.Provider>
  );
}

export function useTrack() {
  const ctx = useContext(TrackContext);
  if (!ctx) {
    throw new Error("useTrack must be used within a TrackProvider");
  }
  return ctx;
}
