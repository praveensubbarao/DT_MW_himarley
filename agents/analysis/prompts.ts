import fs from 'fs';
import type { ParsedTestSuite } from './xml-parser';

export function buildAnalysisPrompt(suites: ParsedTestSuite[], specSnippets: Record<string, string>): string {
  const failures = suites
    .flatMap(s => s.cases.filter(c => c.failed).map(c => ({
      test:    c.name,
      browser: c.browser,
      spec:    c.specFile,
      error:   (c.failureMessage ?? '').slice(0, 600),
    })));

  const total   = suites.reduce((n, s) => n + s.passed + s.failed + s.skipped, 0);
  const passed  = suites.reduce((n, s) => n + s.passed,  0);
  const failed  = suites.reduce((n, s) => n + s.failed,  0);
  const skipped = suites.reduce((n, s) => n + s.skipped, 0);

  const snippetBlock = Object.entries(specSnippets)
    .map(([file, content]) => `=== ${file} ===\n${content.slice(0, 800)}`)
    .join('\n\n');

  return `You are a Playwright test analysis expert. Analyse these test results and write a concise Markdown report.

## Run Summary
- Total: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}
- Pass rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%

## Failures (${failures.length})
${failures.length === 0 ? 'None — all tests passed.' : JSON.stringify(failures, null, 2)}

## Relevant Source Files
${snippetBlock || 'No source snippets available.'}

Write a Markdown report with these sections:
1. ## Test Run Summary  (table: Total / Passed / Failed / Skipped / Pass Rate)
2. ## Failed Tests  (for each failure: test name, browser, likely cause, suggested fix referencing actual method/selector names)
3. ## Patterns Observed  (e.g. mobile-only failures, selector timeouts, etc.)
4. ## Recommended Actions  (numbered list of concrete next steps)

Return ONLY the Markdown — no JSON, no preamble, no fences around the whole response.`;
}
