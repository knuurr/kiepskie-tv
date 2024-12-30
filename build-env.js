import { execSync } from 'child_process';
import fs from 'fs';

function getBuildEnv() {
  const buildTime = new Date().toISOString();
  let commitHash = 'Development';

  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.warn('Unable to get git commit hash:', error);
  }

  return {
    VITE_BUILD_TIME: buildTime,
    VITE_GIT_COMMIT_HASH: commitHash,
  };
}

// Generate the environment variables
const env = getBuildEnv();

// Create .env file content
const envContent = Object.entries(env)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write to .env file
fs.writeFileSync('.env', envContent);

console.log('Build environment variables generated:', env); 