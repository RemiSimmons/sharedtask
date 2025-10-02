"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AppHeader from "@/components/app-header"
import { isAdminUser } from "@/lib/admin"
import SupportReplyForm from "@/components/support-reply-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Send, ArrowLeft, Mail } from "lucide-react"

export default function SupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quickReplyData, setQuickReplyData] = useState({
    customerEmail: '',
    originalSubject: '',
    ticketId: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin')
      return
    }

    if (status === "authenticated") {
      // Check if user has admin access
      if (!isAdminUser(session?.user)) {
        router.push('/')
        return
      }
    }
  }, [status, router, session])

  if (status === "loading") {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="card-beautiful p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Loading Support Dashboard</h2>
                <p className="text-lg text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push('/auth/signin')
    return null
  }

  // Redirect non-admin users
  if (status === "authenticated" && !isAdminUser(session?.user)) {
    router.push('/')
    return null
  }

  const handleQuickSetup = () => {
    // You can populate this from URL params or form inputs
    const email = (document.getElementById('quick-email') as HTMLInputElement)?.value
    const subject = (document.getElementById('quick-subject') as HTMLInputElement)?.value
    const ticket = (document.getElementById('quick-ticket') as HTMLInputElement)?.value
    
    setQuickReplyData({
      customerEmail: email,
      originalSubject: subject,
      ticketId: ticket
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
              <div>
                <h1 className="header-main flex items-center gap-3">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                  Support Center
                </h1>
                <p className="text-lg text-gray-600">
                  Respond to customer emails as support@sharedtask.ai
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="reply" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reply" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Reply
              </TabsTrigger>
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Quick Setup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reply" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    Reply as support@sharedtask.ai
                  </CardTitle>
                  <p className="text-gray-600">
                    Send professional responses that appear to come from your support email address.
                  </p>
                </CardHeader>
                <CardContent>
                  <SupportReplyForm 
                    customerEmail={quickReplyData.customerEmail}
                    originalSubject={quickReplyData.originalSubject}
                    ticketId={quickReplyData.ticketId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Reply Setup</CardTitle>
                  <p className="text-gray-600">
                    Fill in customer details to pre-populate the reply form.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Email:</label>
                    <Input
                      id="quick-email"
                      type="email"
                      placeholder="customer@example.com"
                      defaultValue={quickReplyData.customerEmail}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Subject:</label>
                    <Input
                      id="quick-subject"
                      placeholder="Bug report or feature request"
                      defaultValue={quickReplyData.originalSubject}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Ticket ID (optional):</label>
                    <Input
                      id="quick-ticket"
                      placeholder="ST-ABC123"
                      defaultValue={quickReplyData.ticketId}
                    />
                  </div>
                  
                  <Button onClick={handleQuickSetup} className="w-full">
                    Setup Reply Form
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">1. Receive</h3>
                      <p className="text-sm text-gray-600">
                        Customer emails to support@sharedtask.ai are forwarded to your personal inbox
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Send className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">2. Reply</h3>
                      <p className="text-sm text-gray-600">
                        Use this form to send professional responses from support@sharedtask.ai
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">3. Professional</h3>
                      <p className="text-sm text-gray-600">
                        Customers see replies coming from your official support address
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
