"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/custom-toast"
import { Check, Share2, Copy } from "lucide-react"

interface ShareProjectButtonProps {
  projectId: string
  projectName?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ShareProjectButton({
  projectId,
  projectName,
  className,
  variant = "default",
  size = "default",
}: ShareProjectButtonProps) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const { showToast } = useToast()

  // Check if Web Share API is available
  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" && 
      typeof navigator.share === "function"
    )
  }, [])

  const handleShare = async () => {
    const projectUrl = `${window.location.origin}/project/${projectId}`
    const shareTitle = projectName ? `Join ${projectName}!` : "Join our event!"
    const shareText = "🎉 Help contribute to our event! Claim a task here:"

    // Try Web Share API first (mobile devices)
    if (canShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: projectUrl,
        })
        // No toast needed - native share sheet provides feedback
        return
      } catch (error) {
        // User cancelled or share failed
        // Only show error if it's not an AbortError (user cancellation)
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Share failed:", error)
          // Fall through to clipboard copy
        } else {
          // User cancelled - don't show error
          return
        }
      }
    }

    // Fallback to clipboard copy (desktop or if share fails)
    try {
      await navigator.clipboard.writeText(projectUrl)
      
      setCopied(true)
      showToast({
        type: "success",
        title: "Link copied!",
        message: "Project link has been copied to clipboard",
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
          : canShare 
            ? `Share ${projectName || "project"}` 
            : `Copy link for ${projectName || "project"}`
      }
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 md:w-4 md:h-4 mr-2" />
          Copied!
        </>
      ) : canShare ? (
        <>
          <Share2 className="w-5 h-5 md:w-4 md:h-4 mr-2" />
          Share Project
        </>
      ) : (
        <>
          <Copy className="w-5 h-5 md:w-4 md:h-4 mr-2" />
          Copy Link
        </>
      )}
    </Button>
  )
}

