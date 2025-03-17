'use client'

import { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import axios from "axios"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Clock, Users, UserPlus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Session {
  id: string;
  title: string;
  description: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string | null;
  endTime: string | null;
  livekitRoom: string | null;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  participants: {
    id: string;
    student: {
      id: string;
      name: string;
    };
  }[];
}

// Base API URL - correctly formatted for Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SessionDetailPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id ? params.id.toString() : "";
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      if (!token) return
      
      try {
        setLoading(true)
        console.log(`Fetching session with ID: ${sessionId}`)
        console.log(`Using API URL: ${API_BASE_URL}/api/session/${sessionId}`)
        
        const response = await axios.get(
          `${API_BASE_URL}/api/session/${sessionId}`,
          { 
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        setSession(response.data)
      } catch (err: any) {
        console.error("Error fetching session:", err)
        toast.error("Failed to load session details", {
          description: err.response?.data?.message || "An error occurred"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, token])

  const isTeacher = user?.id === session?.teacher.id
  const isParticipant = session?.participants.some(p => p.student.id === user?.id)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleString()
  }

  const startSession = async () => {
    if (!token || !isTeacher) return
    
    try {
      setActionLoading(true)
      console.log(`Starting session with ID: ${sessionId}`)
      // Updated to match the router path defined in the backend
      console.log(`Using API URL: ${API_BASE_URL}/api/rooms/${sessionId}`)
      
      // Create LiveKit room for the session - corrected API path
      await axios.post(
        `${API_BASE_URL}/api/rooms/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      toast.success("Session started successfully")
      
      // Redirect to join page
      router.push(`/sessions/${sessionId}/join`)
    } catch (err: any) {
      console.error("Error starting session:", err)
      toast.error("Failed to start session", {
        description: err.response?.data?.message || "An error occurred"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const joinSession = async () => {
    if (!token) return
    
    try {
      setActionLoading(true)
      if (!isParticipant && user?.role === 'STUDENT') {
        console.log(`Joining session with ID: ${sessionId}`)
        console.log(`Using API URL: ${API_BASE_URL}/api/session/${sessionId}/join`)
        
        // Join as participant first
        await axios.post(
          `${API_BASE_URL}/api/session/${sessionId}/join`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      
      // Redirect to join page
      router.push(`/sessions/${sessionId}/join`)
    } catch (err: any) {
      console.error("Error joining session:", err)
      toast.error("Failed to join session", {
        description: err.response?.data?.message || "An error occurred"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!session) return null
    
    switch (session.status) {
      case 'LIVE':
        return <Badge variant="destructive">LIVE</Badge>
      case 'SCHEDULED':
        return <Badge variant="outline">Scheduled</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Session not found</h2>
        <p className="text-muted-foreground mt-2">
          The session you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <div className="flex items-center mt-2 space-x-2">
            <p className="text-muted-foreground">By {session.teacher.name}</p>
            {getStatusBadge()}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-line">{session.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>
                  <strong>Start Time:</strong> {formatDate(session.startTime)}
                </span>
              </div>
              
              {session.endTime && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>
                    <strong>End Time:</strong> {formatDate(session.endTime)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>
                  <strong>Participants:</strong> {session.participants.length}
                </span>
              </div>
            </div>
            
            {isTeacher && session.participants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Participants</h3>
                <ul className="space-y-1">
                  {session.participants.map((p) => (
                    <li key={p.id} className="text-sm">
                      {p.student.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {session.status === 'LIVE' ? (
            <Button 
              className="w-full" 
              onClick={joinSession} 
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Join Live Session"}
            </Button>
          ) : session.status === 'SCHEDULED' ? (
            isTeacher ? (
              <Button 
                className="w-full" 
                onClick={startSession} 
                disabled={actionLoading}
              >
                {actionLoading ? "Starting..." : "Start Session"}
              </Button>
            ) : (
              <div className="text-center w-full">
                <p className="text-muted-foreground mb-2">
                  This session hasn't started yet
                </p>
                {!isParticipant && user?.role === 'STUDENT' && (
                  <Button
                    variant="outline"
                    onClick={joinSession}
                    disabled={actionLoading}
                    className="flex items-center"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {actionLoading ? "Joining..." : "Join as Participant"}
                  </Button>
                )}
              </div>
            )
          ) : (
            <p className="text-center text-muted-foreground">
              This session is {session.status.toLowerCase()}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}