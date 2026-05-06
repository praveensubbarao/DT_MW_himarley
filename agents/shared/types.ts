// ─── Pipeline Context ────────────────────────────────────────────────────────

export interface PipelineContext {
  sessionId: string;
  stack: 'dev' | 'stg' | 'prod';
  generatedFiles?: string[];
  executionResult?: ExecutionResult;
}

// ─── Generation ──────────────────────────────────────────────────────────────

export type SkillName =
  | 'playwright-pom'
  | 'playwright-scaffolding'
  | 'playwright-assertions'
  | 'playwright-api-mocking'
  | 'playwright-data';

export interface DesignContext {
  jiraTicket?:       string;   // ticket ID/URL or full ticket text
  confluenceDoc?:    string;   // page URL or pasted content
  figmaScreenshots?: string[]; // absolute file paths to screenshot images
  otherDocs?:        string[]; // any other design doc content or file paths
}

export interface GenerationPayload {
  featureName: string;
  route: string;
  testScenarios: string[];
  skillsToLoad: SkillName[];
  outputDir: string;
  actionOutputDir: string;
  designContext?: DesignContext;
}

export interface GenerationResult {
  success: boolean;
  generatedFiles: string[];
  errors?: string[];
}

// ─── Execution ───────────────────────────────────────────────────────────────

export interface ExecutionPayload {
  specFiles?: string[];
  projects?: string[];
  grep?: string;
  workers?: number;
  stack: 'dev' | 'stg' | 'prod';
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  junitPath: string;
  passed: number;
  failed: number;
  skipped: number;
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface AnalysisPayload {
  junitPath: string;
  executionResult: ExecutionResult;
  writeReportTo: string;
}

export interface FailedTestDetail {
  testName: string;
  browser: string;
  specFile: string;
  failureMessage: string;
  suggestedFix?: string;
}

export interface AnalysisReport {
  summary: string;
  passRate: number;
  failedTests: FailedTestDetail[];
  recommendations: string[];
  reportPath: string;
}

// ─── Orchestration ───────────────────────────────────────────────────────────

export interface OrchestrationTask {
  taskId: string;
  type: 'generate' | 'execute' | 'analyze' | 'full';
  context: PipelineContext;
  generationPayload?: GenerationPayload;
  executionPayload?: ExecutionPayload;
  junitPath?: string;
  writeReportTo?: string;
}
