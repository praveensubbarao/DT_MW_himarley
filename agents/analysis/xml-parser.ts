import fs from 'fs';
import xml2js from 'xml2js';

export interface ParsedTestCase {
  name: string;
  browser: string;
  specFile: string;
  durationSec: number;
  failed: boolean;
  failureMessage?: string;
  systemOut?: string;
}

export interface ParsedTestSuite {
  specFile: string;
  browser: string;
  passed: number;
  failed: number;
  skipped: number;
  cases: ParsedTestCase[];
}

export async function parseJunitXml(xmlPath: string): Promise<ParsedTestSuite[]> {
  const xml    = fs.readFileSync(xmlPath, 'utf8');
  const parsed = await xml2js.parseStringPromise(xml, { explicitArray: true });
  const suites = parsed?.testsuites?.testsuite ?? [];
  const results: ParsedTestSuite[] = [];

  for (const suite of suites) {
    const attrs   = suite.$ ?? {};
    const browser = attrs.hostname ?? attrs.name ?? 'unknown';
    const name    = attrs.name ?? '';

    const cases: ParsedTestCase[] = [];
    for (const tc of suite.testcase ?? []) {
      const tcAttrs   = tc.$ ?? {};
      const failed    = Array.isArray(tc.failure) && tc.failure.length > 0;
      const failMsg   = failed ? (tc.failure[0]?._ ?? tc.failure[0] ?? '') : undefined;
      const sysOut    = tc['system-out']?.[0] ?? undefined;
      cases.push({
        name:           tcAttrs.name ?? '',
        browser,
        specFile:       tcAttrs.classname ?? name,
        durationSec:    parseFloat(tcAttrs.time ?? '0'),
        failed,
        failureMessage: typeof failMsg === 'string' ? failMsg : JSON.stringify(failMsg),
        systemOut:      sysOut,
      });
    }

    const totalTests   = parseInt(attrs.tests   ?? '0', 10);
    const totalFailed  = parseInt(attrs.failures ?? '0', 10);
    const totalSkipped = parseInt(attrs.skipped  ?? '0', 10);

    results.push({
      specFile: name,
      browser,
      passed:   totalTests - totalFailed - totalSkipped,
      failed:   totalFailed,
      skipped:  totalSkipped,
      cases,
    });
  }

  return results;
}
