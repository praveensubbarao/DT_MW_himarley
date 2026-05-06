import fs from 'fs';
import path from 'path';
import { createLogger } from '../shared/logger';
import { callClaude } from '../shared/claude-cli';
import { SPEC_DIR, ACTIONS_DIR } from '../shared/constants';
import type { AnalysisPayload, AnalysisReport } from '../shared/types';
import { parseJunitXml } from './xml-parser';
import { buildAnalysisPrompt } from './prompts';
import { writeReport } from './report-writer';

const log = createLogger('analysis');

export async function runAnalysisAgent(payload: AnalysisPayload): Promise<AnalysisReport> {
  log.info(`Reading JUnit XML: ${payload.junitPath}`);

  if (!fs.existsSync(payload.junitPath)) {
    log.error('JUnit XML not found — run execution first');
    return { summary: 'No results found', passRate: 0, failedTests: [], recommendations: ['Run the execution agent first'], reportPath: payload.writeReportTo };
  }

  const suites = await parseJunitXml(payload.junitPath);

  const total  = suites.reduce((n, s) => n + s.passed + s.failed + s.skipped, 0);
  const passed = suites.reduce((n, s) => n + s.passed, 0);
  const failed = suites.reduce((n, s) => n + s.failed, 0);
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  log.info(`Results: ${passed}/${total} passed (${passRate}%), ${failed} failed`);

  // Load spec snippets for failing tests so Claude has source context
  const specSnippets: Record<string, string> = {};
  const failedSpecNames = new Set(
    suites.flatMap(s => s.cases.filter(c => c.failed).map(c => c.specFile))
  );
  for (const specName of failedSpecNames) {
    const specFile = findFile(SPEC_DIR, specName);
    if (specFile) specSnippets[specFile] = fs.readFileSync(specFile, 'utf8');
    const actionFile = findFile(ACTIONS_DIR, specName.replace(/\.spec$/, 'Actions'));
    if (actionFile) specSnippets[actionFile] = fs.readFileSync(actionFile, 'utf8');
  }

  log.info('Calling claude -p for analysis...');
  const reportMarkdown = callClaude(buildAnalysisPrompt(suites, specSnippets));

  writeReport(payload.writeReportTo, reportMarkdown);
  log.info(`Report written: ${payload.writeReportTo}`);

  const failedTests = suites.flatMap(s =>
    s.cases.filter(c => c.failed).map(c => ({
      testName:       c.name,
      browser:        c.browser,
      specFile:       c.specFile,
      failureMessage: c.failureMessage ?? '',
    }))
  );

  return {
    summary:         `${passed}/${total} passed (${passRate}%) across ${suites.length} suite(s)`,
    passRate,
    failedTests,
    recommendations: extractRecommendations(reportMarkdown),
    reportPath:      payload.writeReportTo,
  };
}

function findFile(baseDir: string, namePart: string): string | undefined {
  if (!fs.existsSync(baseDir)) return undefined;
  const walk = (dir: string): string | undefined => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (entry.name.toLowerCase().includes(namePart.toLowerCase().replace(/\s+/g, '').slice(0, 10))) {
        return full;
      }
    }
    return undefined;
  };
  return walk(baseDir);
}

function extractRecommendations(markdown: string): string[] {
  const section = markdown.match(/## Recommended Actions\n([\s\S]*?)(?:\n##|$)/)?.[1] ?? '';
  return section
    .split('\n')
    .filter(l => /^\d+\./.test(l.trim()))
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}
