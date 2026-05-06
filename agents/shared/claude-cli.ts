import { spawnSync } from 'child_process';
import { createLogger } from './logger';

const log = createLogger('claude-cli');

export function callClaude(prompt: string): string {
  log.info(`Calling claude -p (prompt length: ${prompt.length} chars)`);

  const result = spawnSync('claude', ['-p'], {
    input:    prompt,
    encoding: 'utf8',
    timeout:  120_000,
  });

  if (result.error) {
    throw new Error(`claude CLI not found or failed to start: ${result.error.message}\nMake sure Claude Code is installed and 'claude' is on your PATH.`);
  }

  if (result.status !== 0 && result.stderr) {
    log.error(`claude exited ${result.status}: ${result.stderr.slice(0, 200)}`);
  }

  return result.stdout ?? '';
}

export function parseJSON<T>(raw: string): T {
  // Strip optional ```json ... ``` or ``` ... ``` fences
  const clean = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();
  return JSON.parse(clean) as T;
}
