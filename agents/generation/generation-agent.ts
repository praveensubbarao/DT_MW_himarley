import fs from 'fs';
import path from 'path';
import { createLogger } from '../shared/logger';
import { callClaude, parseJSON } from '../shared/claude-cli';
import type { GenerationPayload, GenerationResult } from '../shared/types';
import { loadSkills } from './skill-loader';
import { buildPrompt } from './prompts';

const log = createLogger('generation');

interface GeneratedFiles {
  files: Array<{ path: string; content: string }>;
}

export async function runGenerationAgent(payload: GenerationPayload): Promise<GenerationResult> {
  log.info(`Generating tests for: ${payload.featureName} → ${payload.route}`);

  const skillContext = loadSkills(payload.skillsToLoad);
  const prompt       = buildPrompt(payload, skillContext);

  log.info('Calling claude -p ...');
  const raw = callClaude(prompt);

  let parsed: GeneratedFiles;
  try {
    parsed = parseJSON<GeneratedFiles>(raw);
  } catch (err) {
    log.error(`Failed to parse Claude response as JSON: ${(err as Error).message}`);
    log.error(`Raw response (first 500 chars): ${raw.slice(0, 500)}`);
    return { success: false, generatedFiles: [], errors: ['Claude did not return valid JSON'] };
  }

  if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
    return { success: false, generatedFiles: [], errors: ['No files in Claude response'] };
  }

  const generatedFiles: string[] = [];
  const errors: string[]         = [];

  for (const file of parsed.files) {
    if (!file.path || !file.content) {
      errors.push(`Skipping file with missing path or content`);
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.content, 'utf8');
      generatedFiles.push(file.path);
      log.info(`Wrote: ${file.path}`);
    } catch (err) {
      errors.push(`Failed to write ${file.path}: ${(err as Error).message}`);
    }
  }

  const success = generatedFiles.length >= 3 && errors.length === 0;
  log.info(`Done: success=${success}, files=${generatedFiles.length}`);
  return { success, generatedFiles, errors: errors.length ? errors : undefined };
}
