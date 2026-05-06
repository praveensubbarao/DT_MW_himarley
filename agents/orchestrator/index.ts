#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Command } from 'commander';
import { SPEC_DIR, ACTIONS_DIR, JUNIT_PATH, OUTPUT_DIR } from '../shared/constants';
import type { OrchestrationTask, GenerationPayload, ExecutionPayload, SkillName, DesignContext } from '../shared/types';
import { runOrchestratorAgent } from './orchestrator-agent';

const program = new Command();

program
  .name('agents')
  .description('Himarley AI Testing Agents — Orchestration, Generation, Execution, Analysis')
  .option('--task <type>',        'Pipeline task: generate | execute | analyze | full', 'full')
  .option('--feature <name>',     'PascalCase feature name for generation (e.g. ContactPage)')
  .option('--route <path>',       'URL route for generation (e.g. /contact/)')
  .option('--scenarios <file>',   'Path to JSON file containing test scenarios array')
  .option('--stack <env>',        'Environment: dev | stg | prod', 'prod')
  .option('--projects <list>',    'Comma-separated browser projects (e.g. chromium,firefox)')
  .option('--grep <pattern>',     'Playwright --grep pattern (e.g. @smoke)')
  .option('--workers <n>',        'Number of parallel workers', parseInt)
  .option('--spec-files <list>',  'Comma-separated absolute spec file paths to run')
  .option('--session-id <id>',    'Resume an existing session (uses saved context)')
  .option('--jira <text>',        'Jira ticket ID, URL, or pasted ticket content')
  .option('--confluence <text>',  'Confluence page URL or pasted page content')
  .option('--figma <paths>',      'Comma-separated paths to Figma screenshot image files')
  .option('--design-docs <list>', 'Comma-separated paths to design docs or inline text snippets')
  .parse(process.argv);

const opts = program.opts<{
  task:        string;
  feature?:    string;
  route?:      string;
  scenarios?:  string;
  stack:       'dev' | 'stg' | 'prod';
  projects?:   string;
  grep?:       string;
  workers?:    number;
  specFiles?:  string;
  sessionId?:  string;
  jira?:       string;
  confluence?: string;
  figma?:      string;
  designDocs?: string;
}>();

async function main() {
  const sessionId = opts.sessionId ?? crypto.randomUUID().slice(0, 8);
  const stack     = opts.stack as 'dev' | 'stg' | 'prod';

  // ── Build generation payload ──────────────────────────────────────────
  let generationPayload: GenerationPayload | undefined;
  if (opts.task === 'generate' || opts.task === 'full') {
    if (!opts.feature) {
      console.error('ERROR: --feature is required for generate/full tasks');
      process.exit(1);
    }
    if (!opts.route) {
      console.error('ERROR: --route is required for generate/full tasks');
      process.exit(1);
    }

    const scenarios: string[] = opts.scenarios
      ? JSON.parse(fs.readFileSync(path.resolve(opts.scenarios), 'utf8'))
      : [`loads the ${opts.feature} and verifies it is visible`];

    const featureSlug = opts.feature.replace(/([A-Z])/g, (m, i) => i === 0 ? m.toLowerCase() : `-${m.toLowerCase()}`);

    const designContext: DesignContext = {};
    if (opts.jira)       designContext.jiraTicket       = opts.jira;
    if (opts.confluence) designContext.confluenceDoc     = opts.confluence;
    if (opts.figma)      designContext.figmaScreenshots  = opts.figma.split(',').map(p => path.resolve(p));
    if (opts.designDocs) designContext.otherDocs         = opts.designDocs.split(',').map(p => path.resolve(p));

    generationPayload = {
      featureName:     opts.feature,
      route:           opts.route,
      testScenarios:   scenarios,
      skillsToLoad:    ['playwright-pom', 'playwright-scaffolding', 'playwright-data'] as SkillName[],
      outputDir:       path.join(SPEC_DIR, 'us', featureSlug.replace(/^-/, '')),
      actionOutputDir: path.join(ACTIONS_DIR, 'us'),
      designContext:   Object.keys(designContext).length ? designContext : undefined,
    };
  }

  // ── Build execution payload ───────────────────────────────────────────
  let executionPayload: ExecutionPayload | undefined;
  if (opts.task === 'execute' || opts.task === 'full') {
    executionPayload = {
      stack,
      specFiles: opts.specFiles?.split(',').map(f => path.resolve(f)),
      projects:  opts.projects?.split(','),
      grep:      opts.grep,
      workers:   opts.workers,
    };
  }

  // ── Build analysis report path ────────────────────────────────────────
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const reportPath = path.join(OUTPUT_DIR, `${sessionId}-analysis.md`);

  // ── Build orchestration task ──────────────────────────────────────────
  const task: OrchestrationTask = {
    taskId:   sessionId,
    type:     opts.task as OrchestrationTask['type'],
    context:  { sessionId, stack },
    generationPayload,
    executionPayload,
  };

  if (opts.task === 'analyze' || opts.task === 'full') {
    task.junitPath     = JUNIT_PATH;
    task.writeReportTo = reportPath;
  }

  console.log(`\nHimarley AI Testing Agents`);
  console.log(`Session: ${sessionId}`);
  console.log(`Task:    ${opts.task}`);
  console.log(`Stack:   ${stack}`);
  if (opts.feature) console.log(`Feature: ${opts.feature}`);
  if (opts.jira)       console.log(`Jira:    ${opts.jira.slice(0, 80)}`);
  if (opts.confluence) console.log(`Confluence: ${opts.confluence.slice(0, 80)}`);
  if (opts.figma)      console.log(`Figma screenshots: ${opts.figma}`);
  if (opts.designDocs) console.log(`Design docs: ${opts.designDocs}`);
  console.log('');

  await runOrchestratorAgent(task);

  if (fs.existsSync(reportPath)) {
    console.log(`\nReport: ${reportPath}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
