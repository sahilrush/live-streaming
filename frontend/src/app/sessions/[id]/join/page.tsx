"use client";

import { useEffect, useState, useCallback } from "react";
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
  GridLayout,
  ControlBar,
  RoomAudioRenderer,
  Chat,
  LayoutContextProvider,
  useParticipants,
  ParticipantTile,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomOptions } from "livekit-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare } from "lucide-react";

interface Session {
  id: string;
  title: string;
  teacher: {
    id: string;
    name: string;
  };
  status: string;
}

interface User {
  id: string;
  role: string;
  name?: string;
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

// Simple avatar component to avoid LiveKit dependency issues
const UserAvatar = ({
  name,
  isTeacher,
  isLocal,
}: {
  name: string;
  isTeacher: boolean;
  isLocal: boolean;
}) => {
  return (
    <div className="text-white text-center p-4">
      <div className="bg-gray-700 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
        {name.charAt(0).toUpperCase()}
      </div>
      <p>{name}</p>
      <p className="text-xs">
        {isLocal ? "(You)" : ""} {isTeacher ? "(Teacher)" : "(Student)"}
      </p>
    </div>
  );
};

// Teacher Video component as a simple placeholder
// Teacher Video component with fixed participants implementation
const TeacherVideo = () => {
  // Get room context instead of using useParticipants
  const room = useRoomContext();

  try {
    // Manually get all participants from the room
    const allParticipants = room
      ? [...Array.from(room.remoteParticipants.values()), room.localParticipant]
      : [];

    // Filter only teacher participants
    const teacherParticipants = allParticipants.filter((participant) => {
      try {
        if (participant.metadata) {
          const metadata = JSON.parse(participant.metadata);
          return metadata.role === "TEACHER";
        }
        return false;
      } catch (error) {
        console.error("Error parsing metadata:", error);
        return false;
      }
    });

    // If no teachers found, show waiting message
    if (teacherParticipants.length === 0) {
      return (
        <div className="flex items-center justify-center h-full bg-muted/30 text-muted-foreground">
          Waiting for Teacher
        </div>
      );
    }

    return (
      <div className="h-full">
        {teacherParticipants.map((participant) => (
          <div
            key={participant.identity}
            className="h-full flex items-center justify-center bg-gray-900"
          >
            <div className="text-white text-center p-4">
              <div className="bg-gray-700 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
                {participant.identity.charAt(0).toUpperCase()}
              </div>
              <p>{participant.identity}</p>
              <p className="text-xs">
                {participant.isLocal ? "(You)" : ""} (Teacher)
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  } catch (err) {
    console.error("Error rendering TeacherVideo:", err);
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 text-destructive">
        Error displaying teacher video
      </div>
    );
  }
};

// Updated ParticipantsList component
const ParticipantsList = () => {
  // Get room context instead of using useParticipants
  const room = useRoomContext();

  try {
    // Manually get all participants from the room
    const allParticipants = room
      ? [...Array.from(room.remoteParticipants.values()), room.localParticipant]
      : [];

    return (
      <div className="h-full overflow-y-auto p-2">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participants ({allParticipants.length})
        </h3>
        <div className="space-y-2">
          {/* List all participants */}
          {allParticipants.map((participant) => {
            let role = "STUDENT";
            let isLocal = participant.isLocal;

            try {
              if (participant.metadata) {
                const metadata = JSON.parse(participant.metadata);
                role = metadata.role || "STUDENT";
              }
            } catch (e) {
              console.error("Error parsing participant metadata", e);
            }

            return (
              <div
                key={participant.identity}
                className={`flex items-center gap-2 p-2 rounded-md ${
                  isLocal ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full ${
                    isLocal ? "bg-primary/20" : "bg-muted"
                  } flex items-center justify-center font-medium text-xs`}
                >
                  {participant.identity.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{participant.identity}</p>
                  <p className="text-xs text-muted-foreground">
                    {isLocal ? "You" : role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error rendering ParticipantsList:", err);
    return (
      <div className="p-2">
        <h3 className="font-medium mb-2">Participants</h3>
        <p className="text-sm text-muted-foreground">Loading participants...</p>
      </div>
    );
  }
};
export default function JoinSessionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id ? params.id.toString() : "";

  const [session, setSession] = useState<Session | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("participants");
  const [roomConnected, setRoomConnected] = useState<boolean>(false);

  // Better error handling for LiveKit
  const [connectionState, setConnectionState] =
    useState<string>("disconnected");
  const [roomError, setRoomError] = useState<Error | null>(null);

  useEffect(() => {
    const setupSession = async () => {
      if (!token || !user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        console.log(`Setting up session with ID: ${sessionId}`);
        console.log(`Using API URL: ${API_BASE_URL}`);
        console.log(`Token available: ${!!token}`);

        // Check if API_BASE_URL is defined
        if (!API_BASE_URL) {
          throw new Error("API URL is not defined");
        }

        // 1. Get session details
        let sessionData;
        try {
          const sessionResponse = await axios.get(
            `${API_BASE_URL}/api/session/${sessionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          sessionData = sessionResponse.data;
          console.log("Session data retrieved:", sessionData);
          setSession(sessionData);
        } catch (sessionError: any) {
          console.error("Error fetching session:", sessionError);
          if (sessionError.response) {
            console.error("Response status:", sessionError.response.status);
            console.error("Response data:", sessionError.response.data);
          }
          throw new Error(`Failed to fetch session: ${sessionError.message}`);
        }

        // 2. Create room if needed (only for teachers with non-live sessions)
        if (
          sessionData.status !== "LIVE" &&
          user.role === "TEACHER" &&
          sessionData.teacher.id === user.id
        ) {
          console.log(`Creating room for session: ${sessionId}`);

          try {
            await axios.post(
              `${API_BASE_URL}/api/rooms/${sessionId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Room created successfully");
          } catch (roomError: any) {
            console.error("Error creating room:", roomError);
            // Continue anyway as the next step will check if a room exists
          }
        }

        // 3. Get LiveKit token
        console.log(`Getting token for session: ${sessionId}`);

        try {
          const tokenResponse = await axios.post(
            `${API_BASE_URL}/api/token/${sessionId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log(
            "Token response received:",
            tokenResponse.data ? "has data" : "no data"
          );

          if (tokenResponse.data && tokenResponse.data.token) {
            const extractedToken = tokenResponse.data.token;

            if (
              typeof extractedToken === "string" &&
              extractedToken.length > 0
            ) {
              console.log(
                "Valid token received, length:",
                extractedToken.length
              );
              setLivekitToken(extractedToken);
            } else {
              throw new Error("Invalid token format received from server");
            }
          } else {
            throw new Error("No token received from server");
          }
        } catch (tokenError: any) {
          console.error("Error fetching token:", tokenError);
          if (tokenError.response) {
            console.error("Response status:", tokenError.response.status);
            console.error("Response data:", tokenError.response.data);
          }
          throw new Error(`Failed to get token: ${tokenError.message}`);
        }
      } catch (err: any) {
        console.error("Error in setupSession:", err);
        setError(err.message || "Failed to join session");
        toast.error("Failed to join session", {
          description: err.message || "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    // Call the async function
    setupSession();

    // Cleanup function
    return () => {
      console.log("Cleaning up session setup...");
      // Any cleanup code needed
    };
  }, [sessionId, token, user, router]);

  const handleDisconnect = useCallback(() => {
    setRoomConnected(false);
    router.push(`/sessions/${sessionId}`);
  }, [router, sessionId]);

  const handleRoomConnected = useCallback(() => {
    console.log("LiveKit room connected successfully");
    setRoomConnected(true);
    setConnectionState("connected");

    // Notify the user that connection is successful
    toast.success("Connected to session");
  }, []);

  const handleRoomError = useCallback((error: Error) => {
    console.error("LiveKit connection error:", error);
    setRoomError(error);
    setConnectionState("error");
    toast.error("Connection error", {
      description: error.message,
    });
  }, []);

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

  // Define options for LiveKit room
  const roomOptions: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      simulcast: true,
      videoCodec: "vp8",
    },
    // Add some tolerance for connection issues
    // reconnectPolicy: {
    //   maxRetries: 10,
    //   retryBackoff: 1.5, // Exponential backoff factor
    // }
  };

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

      {/* Connection Status Indicator */}
      {connectionState === "connecting" && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm py-1 px-4">
          Connecting to session...
        </div>
      )}
      {connectionState === "error" && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm py-1 px-4">
          Connection error: {roomError?.message || "Unknown error"}
        </div>
      )}

      {/* LiveKit Room */}
      <div className="flex-1 p-2 sm:p-4 bg-background">
        {livekitToken && (
          <LiveKitRoom
            token={livekitToken}
            serverUrl={livekitUrl}
            options={roomOptions}
            // Start with media disabled for students, enabled for teachers
            video={isTeacher}
            audio={isTeacher}
            connect={true}
            onDisconnected={handleDisconnect}
            onError={handleRoomError}
            onConnected={handleRoomConnected}
            className="h-full"
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
