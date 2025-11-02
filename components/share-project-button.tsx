"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/custom-toast"
import { Check, Share2, Copy } from "lucide-react"

interface ShareProjectButtonProps {
  projectId: string
  projectName?: string
  shareMessage?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ShareProjectButton({
  projectId,
  projectName,
  shareMessage,
  className,
  variant = "default",
  size = "default",
}: ShareProjectButtonProps) {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const handleShare = async () => {
    const projectUrl = `${window.location.origin}/project/${projectId}`
    const shareTitle = projectName ? `Join ${projectName}!` : "Join our event!"
    const shareText = shareMessage || "📝 Help contribute to our event! Claim a task here:"

    // Always try Web Share API first (works on mobile and some desktop browsers like Chrome/Edge)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: projectUrl,
        })
        // Successfully shared - no toast needed as native share provides feedback
        return
      } catch (error) {
        // User cancelled or share failed
        // Only fall through to clipboard if it's not an AbortError (user cancellation)
        if (error instanceof Error && error.name === "AbortError") {
          // User cancelled - don't show error or copy to clipboard
          return
        }
        // Share failed for another reason - fall through to clipboard copy
        console.log("Native share not available, falling back to clipboard")
      }
    }

    // Fallback to clipboard copy (desktop browsers without native share support)
    try {
      // Copy both the message and the URL
      const textToCopy = `${shareText}\n\n${projectUrl}`
      await navigator.clipboard.writeText(textToCopy)
      
      setCopied(true)
      showToast({
        type: "success",
        title: "Message & link copied!",
        message: "Share message and project link copied to clipboard",
        confirmText: "OK"
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      showToast({
        type: "error",
        title: "Copy failed",
        message: "Please try again",
        confirmText: "OK"
      })
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      aria-label={
        copied 
          ? "Link copied" 
          : `Share ${projectName || "project"}`
      }
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 md:w-4 md:h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5 md:w-4 md:h-4 mr-2" />
          Share Project
        </>
      )}
    </Button>
  )
}

