/**
 * Standalone runner for the Analysis Agent.
 * Usage: npx ts-node run-analysis.ts
 *
 * Reads playwright-results/junit-report.xml and writes a markdown report.
 */
import path from 'path';
import { runAnalysisAgent } from './analysis/analysis-agent';
import { JUNIT_PATH, OUTPUT_DIR } from './shared/constants';
import type { AnalysisPayload } from './shared/types';

const reportPath = path.join(OUTPUT_DIR, `standalone-analysis-${Date.now()}.md`);

const payload: AnalysisPayload = {
  junitPath: JUNIT_PATH,
  executionResult: {
    exitCode: 0, stdout: '', stderr: '',
    durationMs: 0, junitPath: JUNIT_PATH,
    passed: 0, failed: 0, skipped: 0,
  },
  writeReportTo: reportPath,
};

console.log('\n=== ANALYSIS AGENT ===');
console.log(`Reading : ${JUNIT_PATH}`);
console.log(`Report  : ${reportPath}\n`);

runAnalysisAgent(payload).then(result => {
  console.log('\n=== RESULT ===');
  console.log(`Summary   : ${result.summary}`);
  console.log(`Pass rate : ${result.passRate}%`);
  console.log(`Failures  : ${result.failedTests.length}`);
  console.log(`Report    : ${result.reportPath}`);
  result.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
}).catch(err => {
  console.error('Analysis agent failed:', err.message);
  process.exit(1);
});
