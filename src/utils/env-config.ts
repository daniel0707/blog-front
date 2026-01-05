/**
 * Centralized configuration for environment variables
 * Handles resolution for both Vite (import.meta.env) and Node (process.env)
 */

function getEnvVar(key: string): string | undefined {
  // Try import.meta.env first (Vite/browser), then process.env (Node/build)
  return (typeof import.meta !== 'undefined' && import.meta.env?.[key]) || 
         (typeof process !== 'undefined' && process.env?.[key])
}

function getEnvBool(key: string): boolean {
  const value = getEnvVar(key)
  return value === 'true' || value === '1'
}

// ============================================================================
// Webiny CMS Configuration
// ============================================================================

export interface WebinyConfig {
  graphqlEndpoint: string
  apiToken: string
  fileManagerEndpoint: string
}

/**
 * Get Webiny configuration from environment variables
 * @throws {Error} If required configuration is missing
 */
export function getWebinyConfig(): WebinyConfig {
  const graphqlEndpoint = getEnvVar('WEBINY_GRAPHQL_ENDPOINT')
  const apiToken = getEnvVar('WEBINY_API_TOKEN')

  if (!graphqlEndpoint || !apiToken) {
    throw new Error(
      'Missing Webiny configuration. Set WEBINY_GRAPHQL_ENDPOINT and WEBINY_API_TOKEN environment variables.'
    )
  }

  // File Manager endpoint: explicit env var, or derive from GraphQL endpoint
  const fileManagerEndpoint =
    getEnvVar('WEBINY_FILE_MANAGER_ENDPOINT') ||
    graphqlEndpoint.replace(/\/cms\/read\/[^/]+$/, '/graphql')

  return {
    graphqlEndpoint,
    apiToken,
    fileManagerEndpoint,
  }
}

// ============================================================================
// Site Configuration
// ============================================================================

export interface SiteEnvConfig {
  isProd: boolean
  isDev: boolean
  baseUrl: string
}

/**
 * Get site environment configuration
 */
export function getSiteEnvConfig(): SiteEnvConfig {
  const isProd = getEnvVar('PROD') === 'true' || getEnvVar('NODE_ENV') === 'production'
  const isDev = !isProd
  const baseUrl = getEnvVar('BASE_URL') || '/'

  return {
    isProd,
    isDev,
    baseUrl,
  }
}
