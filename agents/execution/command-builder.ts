import path from 'path';
import { PROJECT_ROOT } from '../shared/constants';
import type { ExecutionPayload } from '../shared/types';

export function buildPlaywrightCommand(payload: ExecutionPayload): string {
  const parts = ['npx', 'playwright', 'test'];

  if (payload.specFiles?.length) {
    for (const f of payload.specFiles) {
      parts.push(path.relative(PROJECT_ROOT, f));
    }
  }

  if (payload.projects?.length) {
    for (const p of payload.projects) {
      parts.push(`--project=${p}`);
    }
  }

  if (payload.grep) parts.push(`--grep=${payload.grep}`);
  if (payload.workers) parts.push(`--workers=${payload.workers}`);

  // Always produce JUnit output so the analysis agent can read it
  parts.push('--reporter=list,junit');

  return parts.join(' ');
}
