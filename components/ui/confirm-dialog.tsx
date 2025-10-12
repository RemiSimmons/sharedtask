"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] card-beautiful p-0 border-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-base text-gray-700 leading-relaxed mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="p-6 pt-4 flex flex-col sm:flex-row gap-3">
          {cancelText && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto order-1 sm:order-2 ${
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : ""
            }`}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    variant?: "default" | "destructive"
    isLoading?: boolean
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const confirm = React.useCallback((options: Omit<typeof dialogState, "open">) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        ...options,
        open: true,
        onConfirm: () => {
          options.onConfirm()
          resolve(true)
        },
      })
    })
  }, [])

  const Dialog = React.useCallback(() => {
    return (
      <ConfirmDialog
        {...dialogState}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState((prev) => ({ ...prev, open: false }))
          }
        }}
      />
    )
  }, [dialogState])

  return { confirm, Dialog }
}
