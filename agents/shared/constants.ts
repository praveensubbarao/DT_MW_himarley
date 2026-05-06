import path from 'path';

export const PROJECT_ROOT = path.resolve(__dirname, '../../');
export const SKILL_DIR    = path.join(PROJECT_ROOT, '.claude/skills');
export const SPEC_DIR     = path.join(PROJECT_ROOT, 'src/tests');
export const ACTIONS_DIR  = path.join(PROJECT_ROOT, 'src/actions');
export const FIXTURES_DIR = path.join(PROJECT_ROOT, 'src/utils/fixtures');
export const RESULTS_DIR  = path.join(PROJECT_ROOT, 'playwright-results');
export const JUNIT_PATH   = path.join(RESULTS_DIR, 'junit-report.xml');
export const OUTPUT_DIR   = path.join(PROJECT_ROOT, 'agents/output');
