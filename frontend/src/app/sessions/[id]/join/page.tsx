"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  Chat,
  LayoutContextProvider,
} from "@livekit/components-react";
import "@livekit/components-styles";

interface Session {
  id: string;
  title: string;
  teacher: {
    id: string;
    name: string;
  };
  status: string;
}

// Base API URL - correctly formatted for Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function JoinSessionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id ? params.id.toString() : "";

  const [session, setSession] = useState<Session | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const setupSession = async () => {
      if (!token || !user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        console.log(`Setting up session with ID: ${sessionId}`);

        // 1. Get session details
        const sessionResponse = await axios.get(
          `${API_BASE_URL}/api/session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const sessionData = sessionResponse.data;
        setSession(sessionData);

        if (
          sessionData.status !== "LIVE" &&
          user.role === "TEACHER" &&
          sessionData.teacher.id === user.id
        ) {
          // If teacher and session not live, create room
          console.log(`Creating room for session: ${sessionId}`);

          // Using the routes without /livekit prefix
          try {
            await axios.post(
              `${API_BASE_URL}/api/rooms/${sessionId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Room created successfully");
          } catch (err) {
            console.error("Error creating room:", err);
            // Continue anyway as the next step will check if a room exists
          }
        }

        // 2. Get LiveKit token
        console.log(`Getting token for session: ${sessionId}`);

        // Using the routes without /livekit prefix
        const tokenResponse = await axios.post(
          `${API_BASE_URL}/api/token/${sessionId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Token response type:", typeof tokenResponse.data);

        // Simple token extraction
        if (tokenResponse.data && tokenResponse.data.token) {
          const extractedToken = tokenResponse.data.token;

          if (typeof extractedToken === "string" && extractedToken.length > 0) {
            setLivekitToken(extractedToken);
            console.log(
              "Token extracted successfully (first 20 chars):",
              extractedToken.substring(0, 20) + "..."
            );
          } else {
            console.error("Invalid token format:", tokenResponse.data);
            setError("Invalid token format received from server");
            toast.error("Failed to get a valid session token");
          }
        } else {
          console.error("No token in response:", tokenResponse.data);
          setError("No token received from server");
          toast.error("Failed to get a session token");
        }
      } catch (err: any) {
        console.error("Error setting up session:", err);
        setError(err.response?.data?.message || "Failed to join session");
        toast.error("Failed to join session", {
          description: err.response?.data?.message || "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    setupSession();
  }, [sessionId, token, user, router]);

  const handleDisconnect = () => {
    router.push(`/sessions/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Skeleton className="h-12 w-12 rounded-full" />
        <h2 className="mt-4 text-xl font-semibold">Connecting to session...</h2>
        <p className="text-muted-foreground mt-2">
          Please wait while we set up your connection
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold text-destructive">
          Connection Error
        </h2>
        <p className="text-muted-foreground mt-2">
          {error || "Session not found"}
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!livekitToken) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold">Authorization Error</h2>
        <p className="text-muted-foreground mt-2">
          Failed to get access token for this session
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isTeacher = user?.id === session.teacher.id;
  const livekitUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "wss://unacedmy-clone-77ihspfa.livekit.cloud";

  console.log("Using LiveKit URL:", livekitUrl);
  console.log("Using LiveKit token:", livekitToken.substring(0, 20) + "...");

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <div className="bg-muted p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">{session.title}</h1>
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>
          <Button variant="outline" onClick={handleDisconnect}>
            Leave Session
          </Button>
        </div>
      </div>

      <div className="flex-1 p-0 md:p-4 bg-background">
        {livekitToken && (
          <LiveKitRoom
            token={livekitToken}
            serverUrl={livekitUrl}
            connect={true}
            video={isTeacher}
            audio={isTeacher}
            onDisconnected={handleDisconnect}
            onError={(error: any) => {
              console.error("LiveKit connection error:", error);
              toast.error("Connection error", {
                description: error.message,
              });
            }}
          >
            <LayoutContextProvider>
              <div className="flex h-full">
                {/* Main video area */}
                <div
                  className={`flex-1 flex flex-col h-full ${
                    showChat ? "mr-4" : ""
                  }`}
                >
                  <div className="flex-1 min-h-0">
                    {/* Using VideoConference component */}
                    <VideoConference />
                  </div>
                  <RoomAudioRenderer />
                  <ControlBar
                    controls={{
                      microphone: isTeacher,
                      camera: isTeacher,
                      screenShare: isTeacher,
                      leave: true,
                    }}
                  />
                </div>

                {/* Chat panel */}
                {showChat && (
                  <div className="w-80 flex-shrink-0 border-l border-muted p-2 overflow-y-auto">
                    <Chat />
                  </div>
                )}
              </div>
            </LayoutContextProvider>
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}
