import fs from 'fs';
import path from 'path';
import { ACTIONS_DIR, FIXTURES_DIR, SPEC_DIR } from '../shared/constants';
import type { GenerationPayload, DesignContext } from '../shared/types';

export function buildPrompt(payload: GenerationPayload, skillContext: string): string {
  const sampleSpec    = readFile(path.join(SPEC_DIR,    'us/homepage/HomePageTopNavigation.spec.ts'));
  const sampleActions = readFile(path.join(ACTIONS_DIR, 'us/HomePageActions.ts'));
  const sampleFixture = readFile(path.join(FIXTURES_DIR, 'homepageBaseTest.ts'));

  const featureLower = payload.featureName.charAt(0).toLowerCase() + payload.featureName.slice(1);
  const actionFile   = path.join(payload.actionOutputDir, `${payload.featureName}Actions.ts`);
  const fixtureFile  = path.join(FIXTURES_DIR, `${featureLower}BaseTest.ts`);
  const specFile     = path.join(payload.outputDir, `${payload.featureName}.spec.ts`);

  const scenarios    = payload.testScenarios.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const designBlock  = buildDesignContextBlock(payload.designContext);

  return `You are a Playwright TypeScript test generation expert for the Himarley test suite.

PROJECT CONVENTIONS:
- All imports use the path alias @/* which maps to src/*
- Never use relative imports — always use @/utils/fixtures/...
- Never use page.waitForTimeout()
- Every test() block MUST be preceded by a // Steps: comment listing numbered steps
  (a pre-commit hook enforces this — omitting it will fail the commit)
- Selectors prefer data-testid; fall back to role/text selectors
- Tags: @smoke for happy-path, @regression for edge cases

STEPS COMMENT FORMAT (mandatory):
  test.describe('Description', () => {
    // Steps:
    // 1. First step
    // 2. Second step
    test('test name @smoke', async ({ page, ${featureLower}Actions }) => { ... });
  });

SKILL CONTEXT:
${skillContext}

EXISTING CODE SAMPLES (match this style exactly):

=== src/actions/us/HomePageActions.ts ===
${sampleActions}

=== src/utils/fixtures/homepageBaseTest.ts ===
${sampleFixture}

=== src/tests/us/homepage/HomePageTopNavigation.spec.ts ===
${sampleSpec}
${designBlock}
TASK: Generate Playwright tests for the following feature.

Feature:  ${payload.featureName}
Route:    ${payload.route}
Scenarios:
${scenarios}

Generate exactly three files with these absolute paths:
1. ${actionFile}
2. ${fixtureFile}
3. ${specFile}

IMPORTANT: Return ONLY a JSON object with no markdown fences, no explanation, no other text.
The JSON must match this exact shape:
{
  "files": [
    { "path": "<absolute path>", "content": "<full TypeScript source>" },
    { "path": "<absolute path>", "content": "<full TypeScript source>" },
    { "path": "<absolute path>", "content": "<full TypeScript source>" }
  ]
}`;
}

function buildDesignContextBlock(ctx: DesignContext | undefined): string {
  if (!ctx) return '';

  const sections: string[] = ['\nDESIGN CONTEXT (use this to inform selectors, flow, and assertions):'];

  if (ctx.jiraTicket) {
    sections.push(`\n=== Jira Ticket ===\n${ctx.jiraTicket}`);
  }

  if (ctx.confluenceDoc) {
    sections.push(`\n=== Confluence Document ===\n${ctx.confluenceDoc}`);
  }

  if (ctx.figmaScreenshots?.length) {
    const screenshotNotes = ctx.figmaScreenshots.map(p => {
      const exists = fs.existsSync(p);
      return `- ${p}${exists ? '' : ' [file not found]'}`;
    }).join('\n');
    sections.push(`\n=== Figma Screenshots ===\nThe following screenshot files show the UI being tested.\nUse the file names and any visible element labels to infer data-testid selectors and page structure.\n${screenshotNotes}`);
  }

  if (ctx.otherDocs?.length) {
    ctx.otherDocs.forEach((doc, i) => {
      // If it looks like a file path, read it; otherwise treat as inline text
      const content = fs.existsSync(doc) ? fs.readFileSync(doc, 'utf8') : doc;
      sections.push(`\n=== Design Doc ${i + 1} ===\n${content.slice(0, 2000)}`);
    });
  }

  return sections.join('\n') + '\n';
}

function readFile(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : `[not found: ${filePath}]`;
}
