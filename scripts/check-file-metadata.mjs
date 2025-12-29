import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

const FM_ENDPOINT = 'https://cms-api-dev.vahla.fi/graphql';
const TOKEN = envVars.WEBINY_API_TOKEN;

// Try to get a specific file and see all available fields
const GET_FILE_QUERY = `
  query GetFile {
    fileManager {
      getFile(id: "6866668c5990ed00021c17cf") {
        data {
          id
          name
          src
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

// Also check what the FileMeta type looks like
const INTROSPECT_META = `
  query IntrospectFileMeta {
    __type(name: "FileManagerFileMeta") {
      name
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
`;

async function main() {
  console.log('=== Get Specific File ===\n');
  
  let response = await fetch(FM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query: GET_FILE_QUERY }),
  });
  
  let json = await response.json();
  console.log(JSON.stringify(json, null, 2));
  
  console.log('\n=== FileMeta Type Fields ===\n');
  
  response = await fetch(FM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query: INTROSPECT_META }),
  });
  
  json = await response.json();
  
  if (json.data?.__type?.fields) {
    console.log('Available meta fields:');
    json.data.__type.fields.forEach(field => {
      const typeName = field.type.name || field.type.kind;
      console.log(`  - ${field.name}: ${typeName}`);
    });
  } else {
    console.log(JSON.stringify(json, null, 2));
  }
}

main().catch(console.error);
