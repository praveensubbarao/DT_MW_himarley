import fs from 'fs';
import path from 'path';
import { createLogger } from '../shared/logger';
import { JUNIT_PATH, OUTPUT_DIR } from '../shared/constants';
import type { OrchestrationTask, PipelineContext } from '../shared/types';
import { runGenerationAgent } from '../generation/generation-agent';
import { runExecutionAgent } from '../execution/execution-agent';
import { runAnalysisAgent } from '../analysis/analysis-agent';

const log = createLogger('orchestrator');

export async function runOrchestratorAgent(task: OrchestrationTask): Promise<void> {
  log.info(`Pipeline start — task=${task.type} session=${task.context.sessionId}`);

  const context: PipelineContext = { ...task.context };
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Stage 1: Generation ─────────────────────────────────────────────
  if ((task.type === 'generate' || task.type === 'full') && task.generationPayload) {
    log.info('── Stage 1: Generation ──');
    const result = await runGenerationAgent(task.generationPayload);

    if (!result.success) {
      log.error(`Generation failed: ${result.errors?.join(', ')}`);
      if (task.type === 'generate') return;
    }

    context.generatedFiles = result.generatedFiles;
    saveContext(task.context.sessionId, context);
    log.info(`Generated ${result.generatedFiles.length} file(s)`);
    result.generatedFiles.forEach(f => log.info(`  ${f}`));
  }

  // ── Stage 2: Execution ──────────────────────────────────────────────
  if (task.type === 'execute' || task.type === 'full') {
    log.info('── Stage 2: Execution ──');
    const execPayload = task.executionPayload ?? { stack: task.context.stack };

    // Hand generated files from Stage 1 into the execution run
    if (!execPayload.specFiles?.length && context.generatedFiles?.length) {
      execPayload.specFiles = context.generatedFiles;
    }

    const result = await runExecutionAgent(execPayload);
    context.executionResult = result;
    saveContext(task.context.sessionId, context);

    log.info(`Execution done — exit=${result.exitCode} passed=${result.passed} failed=${result.failed}`);
  }

  // ── Stage 3: Analysis ───────────────────────────────────────────────
  if (task.type === 'analyze' || task.type === 'full') {
    log.info('── Stage 3: Analysis ──');
    const reportPath = task.writeReportTo ?? path.join(OUTPUT_DIR, `${task.context.sessionId}-analysis.md`);

    const result = await runAnalysisAgent({
      junitPath:       task.junitPath ?? JUNIT_PATH,
      executionResult: context.executionResult ?? {
        exitCode: 0, stdout: '', stderr: '', durationMs: 0,
        junitPath: JUNIT_PATH, passed: 0, failed: 0, skipped: 0,
      },
      writeReportTo: reportPath,
    });

    log.info(`Analysis done — ${result.summary}`);
    log.info(`Report: ${result.reportPath}`);
    if (result.recommendations.length) {
      log.info('Recommendations:');
      result.recommendations.forEach((r, i) => log.info(`  ${i + 1}. ${r}`));
    }
  }

  log.info('── Pipeline complete ──');
}

function saveContext(sessionId: string, context: PipelineContext): void {
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${sessionId}-context.json`),
    JSON.stringify(context, null, 2),
    'utf8'
  );
}
