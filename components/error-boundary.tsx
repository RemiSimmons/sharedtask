'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { trackError } from '@/lib/error-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

// ============================================================================
// ERROR BOUNDARY COMPONENTS
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  isReporting: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'component' | 'critical'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo, isReporting: true })

    try {
      // Track the error with context
      const errorId = await trackError(error, {
        component: 'ErrorBoundary',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          level: this.props.level || 'component'
        }
      }, {
        severity: this.props.level === 'critical' ? 'critical' : 'high',
        impact: this.props.level === 'page' ? 'user' : 'system',
        tags: ['react-error-boundary', this.props.level || 'component']
      })

      this.setState({ errorId, isReporting: false })

      // Call custom error handler if provided
      this.props.onError?.(error, errorInfo)

    } catch (trackingError) {
      console.error('Failed to track error:', trackingError)
      this.setState({ isReporting: false })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false
    })
  }

  handleReportIssue = () => {
    const { error, errorId } = this.state
    const subject = `Error Report: ${error?.message || 'Unknown Error'}`
    const body = `Error ID: ${errorId}\nError: ${error?.message}\nStack: ${error?.stack}`
    
    window.open(`mailto:support@sharedtask.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI based on level
      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI() {
    const { error, errorId, isReporting } = this.state
    const { level = 'component', showDetails = false } = this.props

    if (level === 'critical') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Critical Error</CardTitle>
              <CardDescription>
                A critical error has occurred and the application cannot continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorId && (
                <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                  Error ID: <code className="font-mono">{errorId}</code>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Application
                </Button>
                
                <Button variant="outline" onClick={this.handleReportIssue} className="w-full">
                  <Bug className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              {showDetails && error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    if (level === 'page') {
      return (
        <div className="min-h-[400px] flex items-center justify-center px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <CardTitle className="text-lg text-gray-900">Page Error</CardTitle>
              <CardDescription>
                Something went wrong while loading this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isReporting && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  Reporting error...
                </div>
              )}
              
              {errorId && !isReporting && (
                <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                  Error ID: <code className="font-mono">{errorId}</code>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {showDetails && error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    Error Details
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <strong>Message:</strong> {error.message}
                    {error.stack && (
                      <pre className="mt-1 overflow-auto">{error.stack}</pre>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    // Component level error
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800">Component Error</h3>
            <p className="text-sm text-red-700 mt-1">
              This component encountered an error and couldn't render properly.
            </p>
            
            {errorId && (
              <p className="text-xs text-red-600 mt-2 font-mono">
                Error ID: {errorId}
              </p>
            )}
            
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
              
              {showDetails && (
                <Button size="sm" variant="ghost" onClick={this.handleReportIssue}>
                  <Bug className="w-3 h-3 mr-1" />
                  Report
                </Button>
              )}
            </div>

            {showDetails && error && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">
                  Technical Details
                </summary>
                <pre className="mt-1 p-2 bg-red-100 rounded text-red-800 overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    )
  }
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

interface PageErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export function PageErrorBoundary({ children, fallback }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}

interface ComponentErrorBoundaryProps {
  children: ReactNode
  name?: string
  fallback?: ReactNode
}

export function ComponentErrorBoundary({ children, name, fallback }: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      level="component" 
      showDetails={process.env.NODE_ENV === 'development'}
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error(`Component error in ${name}:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

interface CriticalErrorBoundaryProps {
  children: ReactNode
}

export function CriticalErrorBoundary({ children }: CriticalErrorBoundaryProps) {
  return (
    <ErrorBoundary level="critical" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

// ============================================================================
// ERROR BOUNDARY HOOK
// ============================================================================

export function useErrorHandler() {
  return React.useCallback((error: Error, context?: any) => {
    trackError(error, {
      component: 'useErrorHandler',
      ...context
    }, {
      severity: 'medium',
      impact: 'user',
      tags: ['manual-error-report']
    })
  }, [])
}

// ============================================================================
// ASYNC ERROR BOUNDARY
// ============================================================================

interface AsyncErrorBoundaryState {
  error: Error | null
}

interface AsyncErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error) => void
}

export function AsyncErrorBoundary({ children, onError }: AsyncErrorBoundaryProps) {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      trackError(error, {
        component: 'AsyncErrorBoundary',
        metadata: { asyncError: true }
      }, {
        severity: 'high',
        impact: 'user',
        tags: ['async-error']
      })

      onError?.(error)
    }
  }, [error, onError])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Async Operation Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            <Button size="sm" variant="outline" onClick={resetError} className="mt-2">
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onError: setError
          } as any)
        }
        return child
      })}
    </>
  )
}
