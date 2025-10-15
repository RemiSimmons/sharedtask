'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showAlert: (title: string, message: string, onConfirm?: () => void) => void
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToast({ ...toastData, id })
  }, [])

  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showToast({
      type: 'info',
      title,
      message,
      onConfirm,
      confirmText: 'OK'
    })
  }, [showToast])

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showToast({
      type: 'warning',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: 'Yes',
      cancelText: 'Cancel'
    })
  }, [showToast])

  const handleClose = useCallback(() => {
    setToast(null)
  }, [])

  const handleConfirm = useCallback(() => {
    if (toast?.onConfirm) {
      toast.onConfirm()
    }
    handleClose()
  }, [toast, handleClose])

  const handleCancel = useCallback(() => {
    if (toast?.onCancel) {
      toast.onCancel()
    }
    handleClose()
  }, [toast, handleClose])

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getButtonVariant = (type: ToastType) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'success':
        return 'default'
      case 'warning':
        return 'destructive'
      case 'info':
      default:
        return 'default'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, showAlert, showConfirm }}>
      {children}
      {toast && (
        <AlertDialog open={!!toast} onOpenChange={handleClose}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                {getIcon(toast.type)}
                <AlertDialogTitle className="text-left">{toast.title}</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-left">
                {toast.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              {toast.onCancel && (
                <AlertDialogAction
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  {toast.cancelText || 'Cancel'}
                </AlertDialogAction>
              )}
              <AlertDialogAction
                variant={getButtonVariant(toast.type)}
                onClick={handleConfirm}
                className={toast.onCancel ? 'flex-1' : 'w-full'}
              >
                {toast.confirmText || 'OK'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience functions for common use cases
export function useCustomAlert() {
  const { showAlert, showConfirm } = useToast()
  
  const alert = useCallback((message: string, title: string = 'Alert') => {
    showAlert(title, message)
  }, [showAlert])
  
  const confirm = useCallback((message: string, onConfirm: () => void, title: string = 'Confirm') => {
    showConfirm(title, message, onConfirm)
  }, [showConfirm])
  
  return { alert, confirm }
}
