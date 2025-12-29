import { GraphQLClient } from 'graphql-request';

// Get environment variables
const WEBINY_GRAPHQL_ENDPOINT = import.meta.env.WEBINY_GRAPHQL_ENDPOINT;
const WEBINY_API_TOKEN = import.meta.env.WEBINY_API_TOKEN;

if (!WEBINY_GRAPHQL_ENDPOINT || !WEBINY_API_TOKEN) {
  throw new Error(
    'Missing Webiny CMS configuration. Please check your .env file for WEBINY_GRAPHQL_ENDPOINT and WEBINY_API_TOKEN'
  );
}

// Create GraphQL client
export const webinyClient = new GraphQLClient(WEBINY_GRAPHQL_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${WEBINY_API_TOKEN}`,
  },
});

// Helper function to handle GraphQL requests with error handling
export async function queryWebiny<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const data = await webinyClient.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error('Webiny GraphQL Error:', error);
    throw error;
  }
}
