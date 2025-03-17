export const livekitConfig = {
  url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET
}; 