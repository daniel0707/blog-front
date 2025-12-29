import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

const FM_ENDPOINT = 'https://cms-api-dev.vahla.fi/graphql';
const TOKEN = envVars.WEBINY_API_TOKEN;

const QUERY = `
  query ListImages {
    fileManager {
      listFiles(limit: 10) {
        data {
          id
          name
          key
          src
          type
          size
          tags
          createdOn
          meta {
            private
            width
            height
          }
        }
      }
    }
  }
`;

async function main() {
  console.log('Testing File Manager API...\n');
  
  const response = await fetch(FM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query: QUERY }),
  });
  
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch(console.error);
