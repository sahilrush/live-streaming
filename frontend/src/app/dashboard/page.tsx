"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { CalendarDays, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  startTime: string | null;
  endTime: string | null;
  livekitRoom: string | null;
  teacher: Teacher;
  _count: {
    participants: number;
  };
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/session`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSessions(response.data);
      } catch (err: any) {
        toast.error("Failed to load sessions", {
          description: err.response?.data?.message || "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [token]);

  // Filter sessions based on user role
  const mySessions = sessions.filter((session) => {
    if (user?.role === "TEACHER") {
      return session.teacher.id === user.id;
    }
    // For students, this would filter by enrolled sessions
    // When backend provides this data
    return true;
  });

  const upcomingSessions = mySessions.filter(
    (session) => session.status === "SCHEDULED"
  );

  const liveSessions = mySessions.filter(
    (session) => session.status === "LIVE"
  );

  const pastSessions = mySessions.filter(
    (session) =>
      session.status === "COMPLETED" || session.status === "CANCELLED"
  );

  // Skeleton loader for sessions
  const SessionSkeleton = ({ count }: { count: number }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {user?.role === "TEACHER" && (
          <Button asChild>
            <Link href="/sessions/create">Create Session</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <SessionSkeleton count={3} />
          ) : upcomingSessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No upcoming sessions</p>
              {user?.role === "TEACHER" && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/sessions/create">Create Your First Session</Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          {loading ? (
            <SessionSkeleton count={2} />
          ) : liveSessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No live sessions at the moment
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {loading ? (
            <SessionSkeleton count={3} />
          ) : pastSessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No past sessions</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Session card component
const SessionCard = ({ session }: { session: Session }) => {
  const { user } = useAuth();
  const isTeacher = user?.id === session.teacher.id;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case "LIVE":
        return <Badge variant="destructive">LIVE</Badge>;
      case "SCHEDULED":
        return <Badge variant="outline">Scheduled</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1">{session.title}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {session.teacher.name} {isTeacher && "(You)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm line-clamp-2">
          {session.description || "No description provided"}
        </p>
        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-1 h-4 w-4" />
            {formatDate(session.startTime)}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            {session._count.participants} participant
            {session._count.participants !== 1 ? "s" : ""}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {session.status === "LIVE" ? (
          <Button className="w-full" asChild>
            <Link href={`/sessions/${session.id}/join`}>Join Session</Link>
          </Button>
        ) : session.status === "SCHEDULED" ? (
          <Button
            className="w-full"
            variant={isTeacher ? "default" : "outline"}
            asChild
          >
            <Link href={`/sessions/${session.id}`}>
              {isTeacher ? "Manage Session" : "View Details"}
            </Link>
          </Button>
        ) : (
          <Button className="w-full" variant="outline" asChild>
            <Link href={`/sessions/${session.id}`}>View Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
