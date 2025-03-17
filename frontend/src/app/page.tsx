import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16 max-w-5xl mx-auto text-center">
      <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
        Learn from the best educators in real-time
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-3xl">
        Join live interactive classes with top educators or create your own teaching sessions.
        Our platform makes learning engaging, interactive, and accessible from anywhere.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/register">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/sessions">Browse Sessions</Link>
        </Button>
      </div>
      
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium">Live Video Classes</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Interactive video sessions with real-time teacher and student participation
          </p>
        </div>
        
        <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium">Real-time Chat</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Ask questions and get answers instantly during live sessions
          </p>
        </div>
        
        <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-medium">Expert Educators</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Learn from experienced teachers who can bring subjects to life
          </p>
        </div>
      </div>
    </div>
  )
}