/**
 * Standalone runner for the Generation Agent.
 *
 * Usage:
 *   npx ts-node run-generation.ts [featureName] [route]
 *
 * Examples — basic:
 *   npx ts-node run-generation.ts ContactPage /contact/
 *
 * Examples — with design context (edit the designContext block below):
 *   Set jiraTicket, confluenceDoc, figmaScreenshots, or otherDocs
 *   before running to give the agent richer context.
 */
import path from 'path';
import { runGenerationAgent } from './generation/generation-agent';
import { SPEC_DIR, ACTIONS_DIR } from './shared/constants';
import type { GenerationPayload, DesignContext } from './shared/types';

const featureName = process.argv[2] ?? 'ContactPage';
const route       = process.argv[3] ?? '/contact/';

// ── Optional: fill in design context ────────────────────────────────────────
// Remove or leave undefined any fields you don't have.
const designContext: DesignContext = {
  // jiraTicket: 'JIRA-1234: Add contact form with name, email, and message fields',
  // confluenceDoc: 'https://confluence.example.com/pages/contact-page-spec',
  // figmaScreenshots: ['/path/to/contact-page-desktop.png', '/path/to/contact-page-mobile.png'],
  // otherDocs: ['/path/to/contact-page-requirements.md'],
};
// ────────────────────────────────────────────────────────────────────────────

const hasDesignContext = Object.values(designContext).some(v => v !== undefined);

const payload: GenerationPayload = {
  featureName,
  route,
  testScenarios: [
    `loads the ${featureName} and verifies the heading is visible @smoke`,
    `navigates to ${route} directly and confirms the URL @smoke`,
  ],
  skillsToLoad:    ['playwright-pom', 'playwright-scaffolding'],
  outputDir:       path.join(SPEC_DIR, 'us', featureName.toLowerCase()),
  actionOutputDir: path.join(ACTIONS_DIR, 'us'),
  designContext:   hasDesignContext ? designContext : undefined,
};

console.log('\n=== GENERATION AGENT ===');
console.log(`Feature: ${featureName}  Route: ${route}`);
if (hasDesignContext) {
  console.log('Design context:');
  if (designContext.jiraTicket)         console.log(`  Jira:        ${designContext.jiraTicket.slice(0, 80)}`);
  if (designContext.confluenceDoc)       console.log(`  Confluence:  ${designContext.confluenceDoc.slice(0, 80)}`);
  if (designContext.figmaScreenshots)    console.log(`  Figma:       ${designContext.figmaScreenshots.join(', ')}`);
  if (designContext.otherDocs)           console.log(`  Other docs:  ${designContext.otherDocs.join(', ')}`);
}
console.log('Generating action class, fixture, and spec...\n');

runGenerationAgent(payload).then(result => {
  console.log('\n=== RESULT ===');
  console.log('Success:', result.success);
  console.log('Files written:');
  result.generatedFiles.forEach(f => console.log(' ', f));
  if (result.errors?.length) console.error('Errors:', result.errors);
}).catch(err => {
  console.error('Generation agent failed:', err.message);
  process.exit(1);
});
