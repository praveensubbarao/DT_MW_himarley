import { spawnSync } from 'child_process';
import { createLogger } from '../shared/logger';
import { callClaude } from '../shared/claude-cli';
import { PROJECT_ROOT, JUNIT_PATH } from '../shared/constants';
import type { ExecutionPayload, ExecutionResult } from '../shared/types';
import { buildPlaywrightCommand } from './command-builder';
import { buildErrorAnalysisPrompt } from './prompts';

const log = createLogger('execution');

export async function runExecutionAgent(payload: ExecutionPayload): Promise<ExecutionResult> {
  const command = buildPlaywrightCommand(payload);
  log.info(`Running: ${command}`);

  const start  = Date.now();
  const result = spawnSync(command, {
    shell:    true,
    cwd:      PROJECT_ROOT,
    encoding: 'utf8',
    timeout:  600_000,
    env: {
      ...process.env,
      STACK: payload.stack,
      CI:    'true',
      ...(payload.workers ? { WORKER_COUNT: String(payload.workers) } : {}),
    },
  });
  const durationMs = Date.now() - start;
  const exitCode   = result.status ?? -1;
  const stdout     = result.stdout ?? '';
  const stderr     = result.stderr ?? '';

  log.info(`Exit code: ${exitCode}, duration: ${durationMs}ms`);

  // Distinguish test failures (expected) from CLI/config errors (unexpected)
  const isCliError = exitCode !== 0 && isCLIError(stderr, stdout);
  if (isCliError) {
    log.error('Detected CLI/config error — asking Claude for diagnosis');
    const diagnosis = callClaude(buildErrorAnalysisPrompt(command, stderr, stdout));
    log.info(`Claude diagnosis:\n${diagnosis}`);
  }

  const { passed, failed, skipped } = parseCounts(stdout);
  log.info(`Passed: ${passed}  Failed: ${failed}  Skipped: ${skipped}`);

  return { exitCode, stdout, stderr, durationMs, junitPath: JUNIT_PATH, passed, failed, skipped };
}

function isCLIError(stderr: string, stdout: string): boolean {
  const cliErrorPatterns = [
    'Unknown option', 'Cannot find module', 'error TS', 'SyntaxError',
    'No tests found', 'Could not resolve', 'ENOENT',
  ];
  const combined = stderr + stdout;
  return cliErrorPatterns.some(p => combined.includes(p));
}

function parseCounts(stdout: string): { passed: number; failed: number; skipped: number } {
  // Playwright list reporter summary line: "X passed (Xs)"  "Y failed"  "Z skipped"
  const passed  = parseInt(stdout.match(/(\d+)\s+passed/)?.[1]  ?? '0', 10);
  const failed  = parseInt(stdout.match(/(\d+)\s+failed/)?.[1]  ?? '0', 10);
  const skipped = parseInt(stdout.match(/(\d+)\s+skipped/)?.[1] ?? '0', 10);
  return { passed, failed, skipped };
}
