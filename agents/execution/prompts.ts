export function buildErrorAnalysisPrompt(command: string, stderr: string, stdout: string): string {
  return `A Playwright CLI command failed with a configuration or infrastructure error (not a test failure).

Command: ${command}

stderr:
${stderr.slice(0, 1000)}

stdout:
${stdout.slice(0, 500)}

Diagnose the problem in 2-3 sentences and suggest the exact corrected command or fix.
Be concise and specific.`;
}
