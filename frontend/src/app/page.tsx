import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Learn from the best educators in <span className="text-blue-600 dark:text-blue-400">real-time</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
            Our platform makes learning engaging, interactive, and accessible from anywhere.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-lg border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              <Link href="/sessions">Browse Sessions</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Live Video Classes</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Interactive video sessions with real-time participation and collaboration tools.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Real-time Chat</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ask questions and get answers instantly during live sessions.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Expert Educators</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Learn from experienced teachers who bring subjects to life.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Trusted by educators and students worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-70">
            <div className="h-8 w-auto">University Name</div>
            <div className="h-8 w-auto">Academy Name</div>
            <div className="h-8 w-auto">Institute Name</div>
            <div className="h-8 w-auto">School Name</div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto text-center rounded-2xl p-8 border border-blue-100 dark:border-blue-900">
          <h2 className="text-2xl font-bold mb-4">Ready to transform your learning?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
            Join thousands of students already experiencing our interactive education platform.
          </p>
          <Button size="lg" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}