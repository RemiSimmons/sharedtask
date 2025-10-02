"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send } from 'lucide-react'

interface SupportReplyFormProps {
  customerEmail?: string
  originalSubject?: string
  ticketId?: string
}

export default function SupportReplyForm({ 
  customerEmail = '', 
  originalSubject = '', 
  ticketId = '' 
}: SupportReplyFormProps) {
  const [to, setTo] = useState(customerEmail)
  const [subject, setSubject] = useState(originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message, ticketId })
      })

      if (response.ok) {
        setSuccess(true)
        setMessage('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error('Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Reply as support@sharedtask.ai
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">To:</label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              placeholder="customer@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject:</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Re: Support request"
            />
          </div>
          
          {ticketId && (
            <div>
              <label className="block text-sm font-medium mb-1">Ticket ID:</label>
              <Input value={ticketId} disabled className="bg-gray-50" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={8}
              placeholder="Type your response here..."
              className="resize-none"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !to || !subject || !message}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Reply'}
          </Button>
          
          {success && (
            <div className="text-green-600 text-center font-medium">
              ✅ Reply sent successfully!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
