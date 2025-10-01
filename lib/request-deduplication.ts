// Request Deduplication for Performance Optimization
"use client"

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 30000 // 30 seconds default TTL
  ): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // Create new request
    const promise = fetcher()
      .then(data => {
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: now
        })
        
        // Remove from pending requests
        this.pendingRequests.delete(key)
        
        return data
      })
      .catch(error => {
        // Remove from pending requests on error
        this.pendingRequests.delete(key)
        throw error
      })

    // Store pending request
    this.pendingRequests.set(key, promise)
    
    return promise
  }

  invalidate(key: string) {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern)
    
    // Clear matching cache entries
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
    
    // Clear matching pending requests
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys()),
      pendingKeys: Array.from(this.pendingRequests.keys())
    }
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now()
    const maxAge = 300000 // 5 minutes
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key)
      }
    }
  }
}

// Global request cache instance
const requestCache = new RequestCache()

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup()
  }, 300000)
}

// Main deduplication function
export async function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return requestCache.get(key, fetcher, ttl)
}

// Utility functions
export function invalidateCache(key: string) {
  requestCache.invalidate(key)
}

export function invalidateCachePattern(pattern: string) {
  requestCache.invalidatePattern(pattern)
}

export function clearCache() {
  requestCache.clear()
}

export function getCacheStats() {
  return requestCache.getStats()
}

// React hook for cache management
export function useRequestCache() {
  return {
    deduplicateRequest,
    invalidateCache,
    invalidateCachePattern,
    clearCache,
    getCacheStats,
  }
}

// Optimized fetch wrapper with automatic deduplication
export async function optimizedFetch<T = any>(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options || {})}`
  
  return deduplicateRequest(
    cacheKey,
    async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    },
    ttl
  )
}

// Batch request deduplication
export async function batchRequests<T>(
  requests: Array<{
    key: string
    fetcher: () => Promise<T>
    ttl?: number
  }>
): Promise<T[]> {
  return Promise.all(
    requests.map(({ key, fetcher, ttl }) =>
      deduplicateRequest(key, fetcher, ttl)
    )
  )
}

// Performance tracking for requests
let requestMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  avgResponseTime: 0,
  responseTimeSum: 0,
}

// Enhanced deduplication with metrics
export async function deduplicateRequestWithMetrics<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const startTime = performance.now()
  requestMetrics.totalRequests++
  
  const result = await requestCache.get(key, fetcher, ttl)
  
  const endTime = performance.now()
  const responseTime = endTime - startTime
  requestMetrics.responseTimeSum += responseTime
  requestMetrics.avgResponseTime = requestMetrics.responseTimeSum / requestMetrics.totalRequests
  
  console.log(`⏱️ Request ${key} took ${responseTime.toFixed(2)}ms`)
  
  return result
}

export function getRequestMetrics() {
  return {
    ...requestMetrics,
    cacheHitRate: requestMetrics.totalRequests > 0 
      ? (requestMetrics.cacheHits / requestMetrics.totalRequests * 100).toFixed(2) + '%'
      : '0%'
  }
}

export function resetRequestMetrics() {
  requestMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    responseTimeSum: 0,
  }
}