/**
 * Standalone runner for the Execution Agent.
 * Usage: npx ts-node run-execution.ts [stack] [projects]
 *
 * Example:
 *   npx ts-node run-execution.ts prod chromium
 */
import { runExecutionAgent } from './execution/execution-agent';
import type { ExecutionPayload } from './shared/types';

const stack    = (process.argv[2] ?? 'prod') as 'dev' | 'stg' | 'prod';
const projects = process.argv[3] ? process.argv[3].split(',') : ['chromium'];

const payload: ExecutionPayload = { stack, projects };

console.log('\n=== EXECUTION AGENT ===');
console.log(`Stack: ${stack}  Projects: ${projects.join(', ')}`);
console.log('Running: npx playwright test ...\n');

runExecutionAgent(payload).then(result => {
  console.log('\n=== RESULT ===');
  console.log(`Exit code : ${result.exitCode}`);
  console.log(`Passed    : ${result.passed}`);
  console.log(`Failed    : ${result.failed}`);
  console.log(`Skipped   : ${result.skipped}`);
  console.log(`Duration  : ${result.durationMs}ms`);
  console.log(`JUnit XML : ${result.junitPath}`);
}).catch(err => {
  console.error('Execution agent failed:', err.message);
  process.exit(1);
});
