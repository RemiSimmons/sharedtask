/**
 * SECURE API CLIENT
 * 
 * Wrapper around fetch() that automatically includes CSRF protection headers
 * Use this for all API calls to ensure consistent security
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'fetch', // CSRF protection header
}

// ============================================================================
// API CLIENT
// ============================================================================

export interface ApiOptions extends RequestInit {
  // Custom options can be added here
}

/**
 * Secure fetch wrapper with CSRF protection
 */
export async function apiFetch(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  // Merge headers with CSRF protection
  const headers = {
    ...DEFAULT_HEADERS,
    ...options.headers,
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  return response
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * GET request
 */
export async function apiGet(url: string, options: ApiOptions = {}) {
  return apiFetch(url, {
    ...options,
    method: 'GET',
  })
}

/**
 * POST request
 */
export async function apiPost(
  url: string,
  data?: any,
  options: ApiOptions = {}
) {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request
 */
export async function apiPut(
  url: string,
  data?: any,
  options: ApiOptions = {}
) {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request
 */
export async function apiDelete(url: string, options: ApiOptions = {}) {
  return apiFetch(url, {
    ...options,
    method: 'DELETE',
  })
}

/**
 * PATCH request
 */
export async function apiPatch(
  url: string,
  data?: any,
  options: ApiOptions = {}
) {
  return apiFetch(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parse API response and handle errors
 */
export async function handleApiResponse<T = any>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage
    }
    
    throw new Error(errorMessage)
  }
  
  // Parse successful response
  try {
    return await response.json()
  } catch {
    // If response isn't JSON, return empty object
    return {} as T
  }
}

// ============================================================================
// COMBINED HELPERS
// ============================================================================

/**
 * POST request with automatic error handling
 */
export async function apiPostJSON<T = any>(
  url: string,
  data?: any
): Promise<T> {
  const response = await apiPost(url, data)
  return handleApiResponse<T>(response)
}

/**
 * GET request with automatic error handling
 */
export async function apiGetJSON<T = any>(url: string): Promise<T> {
  const response = await apiGet(url)
  return handleApiResponse<T>(response)
}

/**
 * PUT request with automatic error handling
 */
export async function apiPutJSON<T = any>(
  url: string,
  data?: any
): Promise<T> {
  const response = await apiPut(url, data)
  return handleApiResponse<T>(response)
}

/**
 * DELETE request with automatic error handling
 */
export async function apiDeleteJSON<T = any>(url: string): Promise<T> {
  const response = await apiDelete(url)
  return handleApiResponse<T>(response)
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  fetch: apiFetch,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
  getJSON: apiGetJSON,
  postJSON: apiPostJSON,
  putJSON: apiPutJSON,
  deleteJSON: apiDeleteJSON,
  handleResponse: handleApiResponse,
}



