// Performance Monitoring for SharedTask
"use client"

interface PerformanceMetrics {
  requestCount: number
  totalTransferred: number
  finishTime: number
  domContentLoaded: number
  loadTime: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observer: PerformanceObserver | null = null
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring() {
    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.trackNavigationTiming()
    }

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      this.setupResourceObserver()
    }

    // Track network requests
    this.trackNetworkRequests()
  }

  private trackNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const metrics: PerformanceMetrics = {
            requestCount: performance.getEntriesByType('resource').length,
            totalTransferred: this.calculateTotalTransferred(),
            finishTime: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            timestamp: Date.now()
          }
          
          this.metrics.push(metrics)
          this.logMetrics(metrics)
        }
      }, 1000) // Wait 1 second after load to get accurate metrics
    })
  }

  private setupResourceObserver() {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const excessiveRequests = entries.filter(entry => 
        entry.name.includes('/api/') && 
        entry.duration > 1000 // Requests taking more than 1 second
      )
      
      if (excessiveRequests.length > 0) {
        console.warn('Slow API requests detected:', excessiveRequests)
      }
    })
    
    this.observer.observe({ entryTypes: ['resource'] })
  }

  private trackNetworkRequests() {
    let requestCount = 0
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      requestCount++
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Log slow requests
        if (duration > 2000) {
          console.warn(`Slow request detected: ${args[0]} took ${duration.toFixed(2)}ms`)
        }
        
        // Track excessive request counts
        if (requestCount > 100) {
          console.warn(`High request count detected: ${requestCount} requests`)
        }
        
        return response
      } catch (error) {
        console.error(`Request failed: ${args[0]}`, error)
        throw error
      }
    }
  }

  private calculateTotalTransferred(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return resources.reduce((total, resource) => {
      return total + (resource.transferSize || 0)
    }, 0)
  }

  private logMetrics(metrics: PerformanceMetrics) {
    console.group('📊 Performance Metrics')
    console.log(`🌐 Requests: ${metrics.requestCount}`)
    console.log(`📦 Transferred: ${(metrics.totalTransferred / 1024 / 1024).toFixed(2)} MB`)
    console.log(`⏱️ Finish Time: ${(metrics.finishTime / 1000).toFixed(2)}s`)
    console.log(`🎯 DOM Ready: ${(metrics.domContentLoaded / 1000).toFixed(2)}s`)
    console.log(`🚀 Load Time: ${(metrics.loadTime / 1000).toFixed(2)}s`)
    
    // Performance warnings
    if (metrics.requestCount > 100) {
      console.warn('⚠️ High request count detected!')
    }
    if (metrics.finishTime > 10000) {
      console.warn('⚠️ Slow finish time detected!')
    }
    if (metrics.totalTransferred > 10 * 1024 * 1024) {
      console.warn('⚠️ Large transfer size detected!')
    }
    
    console.groupEnd()
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageMetrics(): Partial<PerformanceMetrics> | null {
    if (this.metrics.length === 0) return null
    
    const totals = this.metrics.reduce((acc, metric) => ({
      requestCount: acc.requestCount + metric.requestCount,
      totalTransferred: acc.totalTransferred + metric.totalTransferred,
      finishTime: acc.finishTime + metric.finishTime,
      domContentLoaded: acc.domContentLoaded + metric.domContentLoaded,
      loadTime: acc.loadTime + metric.loadTime,
    }), {
      requestCount: 0,
      totalTransferred: 0,
      finishTime: 0,
      domContentLoaded: 0,
      loadTime: 0,
    })
    
    const count = this.metrics.length
    return {
      requestCount: Math.round(totals.requestCount / count),
      totalTransferred: Math.round(totals.totalTransferred / count),
      finishTime: Math.round(totals.finishTime / count),
      domContentLoaded: Math.round(totals.domContentLoaded / count),
      loadTime: Math.round(totals.loadTime / count),
    }
  }

  reset() {
    this.metrics = []
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Hook for React components
export function usePerformanceMonitor() {
  return {
    getLatestMetrics: () => performanceMonitor.getLatestMetrics(),
    getAllMetrics: () => performanceMonitor.getAllMetrics(),
    getAverageMetrics: () => performanceMonitor.getAverageMetrics(),
    reset: () => performanceMonitor.reset(),
  }
}

// Performance budget checker
export function checkPerformanceBudget(metrics: PerformanceMetrics) {
  const budgets = {
    maxRequests: 50,
    maxTransferMB: 5,
    maxFinishTimeMs: 10000,
    maxDOMReadyMs: 2000,
    maxLoadTimeMs: 3000,
  }
  
  const violations = []
  
  if (metrics.requestCount > budgets.maxRequests) {
    violations.push(`Too many requests: ${metrics.requestCount} > ${budgets.maxRequests}`)
  }
  
  if (metrics.totalTransferred > budgets.maxTransferMB * 1024 * 1024) {
    violations.push(`Transfer size too large: ${(metrics.totalTransferred / 1024 / 1024).toFixed(2)}MB > ${budgets.maxTransferMB}MB`)
  }
  
  if (metrics.finishTime > budgets.maxFinishTimeMs) {
    violations.push(`Finish time too slow: ${(metrics.finishTime / 1000).toFixed(2)}s > ${budgets.maxFinishTimeMs / 1000}s`)
  }
  
  if (metrics.domContentLoaded > budgets.maxDOMReadyMs) {
    violations.push(`DOM ready too slow: ${(metrics.domContentLoaded / 1000).toFixed(2)}s > ${budgets.maxDOMReadyMs / 1000}s`)
  }
  
  if (metrics.loadTime > budgets.maxLoadTimeMs) {
    violations.push(`Load time too slow: ${(metrics.loadTime / 1000).toFixed(2)}s > ${budgets.maxLoadTimeMs / 1000}s`)
  }
  
  return {
    passed: violations.length === 0,
    violations,
    score: Math.max(0, 100 - (violations.length * 20)) // Each violation reduces score by 20
  }
}

