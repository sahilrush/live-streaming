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
  Chat,
  LayoutContextProvider,
  VideoTrack,
  useTracks,
  useRoomContext,
  TrackReference,
  ParticipantTile,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RemoteParticipant, TrackPublication } from "livekit-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare, X } from "lucide-react";

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

// Custom PDF Viewer component
const PDFViewer = () => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-muted/30 rounded-lg">
      <div className="text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground/60" />
        <p className="mt-4 text-muted-foreground">PDF Document Viewer</p>
        <p className="text-sm text-muted-foreground/70">
          (Placeholder for PDF content)
        </p>
      </div>
    </div>
  );
};

// Custom Teacher Video component
const TeacherVideo = () => {
  const tracks: TrackReference[] = useTracks(
    [Track.Source.Camera, Track.Source.Microphone],
    { onlySubscribed: true }
  );

  // Filter only teacher participants
  const teacherTracks = tracks.filter(({ participant }) => {
    if (!participant) return false;
    try {
      const metadata = JSON.parse(participant.metadata || "{}");
      return metadata.role === "TEACHER";
    } catch (error) {
      console.error("Error parsing metadata:", error);
      return false;
    }
  });

  // Ensure unique teacher participants
  const uniqueTeacherTracks = teacherTracks.reduce<TrackReference[]>(
    (acc, track) => {
      if (
        !acc.some(
          (t) => t.participant?.identity === track.participant?.identity
        )
      ) {
        acc.push(track);
      }
      return acc;
    },
    []
  );

  return (
    <div className="grid grid-cols-1 h-full gap-2">
      {uniqueTeacherTracks
        .filter(({ participant }) => participant) // Ensure participant exists
        .map(({ participant }, index) => (
          <ParticipantTile
            key={`${participant.identity}-${index}`}
            participant={participant}
          />
        ))}
    </div>
  );
};

// Participants List component
const ParticipantsList = () => {
  const room = useRoomContext();

  return (
    <div className="h-full overflow-y-auto p-2">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Participants ({room.numParticipants})
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-medium text-xs">
            You
          </div>
          <div>
            <p className="text-sm font-medium">
              {room.localParticipant.identity}
            </p>
            <p className="text-xs text-muted-foreground">You</p>
          </div>
        </div>
        {Array.from(room.remoteParticipants.values()).map(
          (participant: RemoteParticipant) => (
            <div
              key={participant.identity}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium text-xs">
                {participant.identity.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{participant.identity}</p>
                <p className="text-xs text-muted-foreground">
                  {
                    JSON.parse(participant.metadata || '{"role":"STUDENT"}')
                      .role
                  }
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default function JoinSessionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id ? params.id.toString() : "";

  const [session, setSession] = useState<Session | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("participants");

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

        const tokenResponse = await axios.post(
          `${API_BASE_URL}/api/token/${sessionId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (tokenResponse.data && tokenResponse.data.token) {
          const extractedToken = tokenResponse.data.token;

          if (typeof extractedToken === "string" && extractedToken.length > 0) {
            setLivekitToken(extractedToken);
          } else {
            setError("Invalid token format received from server");
            toast.error("Failed to get a valid session token");
          }
        } else {
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

  const isTeacher = user?.role === "TEACHER" && user?.id === session.teacher.id;
  const livekitUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "wss://unacedmy-clone-77ihspfa.livekit.cloud";

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-muted p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">{session.title}</h1>
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDisconnect}>
            Leave Session
          </Button>
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1 p-2 sm:p-4 bg-background">
        {livekitToken && (
          <LiveKitRoom
            token={livekitToken}
            serverUrl={livekitUrl}
            connect={true}
            // Only enable video/audio for teacher by default
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                {/* PDF Panel - Takes 3/4 of the width on desktop */}
                <div className="md:col-span-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border overflow-hidden">
                  <PDFViewer />
                </div>

                {/* Right sidebar - Takes 1/4 of the width on desktop */}
                <div className="md:col-span-1 flex flex-col gap-4">
                  {/* Teacher video panel - only visible to everyone */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border h-64 overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-sm font-medium border-b border-border flex items-center justify-between">
                      Teacher Camera
                      {isTeacher && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Your Camera
                        </span>
                      )}
                    </div>
                    <div className="p-1 h-[calc(100%-36px)]">
                      <TeacherVideo />
                    </div>
                  </div>

                  {/* Tabs for Participants & Chat */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
                    <Tabs
                      defaultValue="participants"
                      className="w-full h-full flex flex-col"
                      onValueChange={setActiveTab}
                    >
                      <div className="border-b border-border px-1">
                        <TabsList className="grid grid-cols-2">
                          <TabsTrigger
                            value="participants"
                            className="text-xs sm:text-sm"
                          >
                            <Users className="h-3.5 w-3.5 mr-1.5" />
                            Participants
                          </TabsTrigger>
                          <TabsTrigger
                            value="chat"
                            className="text-xs sm:text-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Chat
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent
                        value="participants"
                        className="flex-1 overflow-hidden mt-0 p-0"
                      >
                        <ParticipantsList />
                      </TabsContent>

                      <TabsContent
                        value="chat"
                        className="flex-1 overflow-hidden mt-0 p-0"
                      >
                        <Chat />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Audio renderer and control bar */}
              <RoomAudioRenderer />
              <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border p-1">
                <ControlBar
                  controls={{
                    microphone: isTeacher, // Only teachers can control microphone
                    camera: isTeacher, // Only teachers can control camera
                    screenShare: isTeacher, // Only teachers can share screen
                    chat: false, // We have our own chat UI
                    leave: true,
                  }}
                />
              </div>
            </LayoutContextProvider>
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}
