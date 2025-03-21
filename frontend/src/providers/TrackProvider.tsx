"use client";

import { TrackRefContext } from "@livekit/components-react";

export default function TrackContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrackRefContext.Provider value={{}}>
      {children}
    </TrackRefContext.Provider>
  );
}
