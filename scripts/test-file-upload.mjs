import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

const FM_ENDPOINT = 'https://cms-api-dev.vahla.fi/graphql';
const TOKEN = envVars.WEBINY_API_TOKEN;

// Check what mutations are available for File Manager
const INTROSPECTION_QUERY = `
  query IntrospectFileMutations {
    __type(name: "FileManagerMutation") {
      name
      fields {
        name
        description
        args {
          name
          type {
            name
            kind
            ofType {
              name
            }
          }
        }
      }
    }
  }
`;

async function main() {
  console.log('=== Checking File Manager Mutations ===\n');
  
  const response = await fetch(FM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query: INTROSPECTION_QUERY }),
  });
  
  const json = await response.json();
  
  if (json.data?.__type?.fields) {
    console.log('Available mutations:');
    json.data.__type.fields.forEach(field => {
      console.log(`\n${field.name}:`);
      if (field.description) console.log(`  Description: ${field.description}`);
      if (field.args.length > 0) {
        console.log('  Arguments:');
        field.args.forEach(arg => {
          const typeName = arg.type.name || arg.type.ofType?.name || arg.type.kind;
          console.log(`    - ${arg.name}: ${typeName}`);
        });
      }
    });
  } else {
    console.log('Result:', JSON.stringify(json, null, 2));
  }
}

main().catch(console.error);
