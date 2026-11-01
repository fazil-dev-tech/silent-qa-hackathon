import type { DefectReport, TelemetryEvent } from './types.ts';

/**
 * Generates an automated Playwright reproduction test script from report evidence
 */
export function generatePlaywrightReproductionScript(
  report: Partial<DefectReport>,
  evidence: TelemetryEvent[]
): string {
  const targetUrl = evidence.find((e) => e.url && e.url.startsWith('http'))?.url || 'http://localhost:3000';
  const clicks = evidence.filter((e) => e.type === 'click' && e.selector);
  const networkCalls = evidence.filter((e) => e.type === 'network' && e.url);

  let script = `import { test, expect } from '@playwright/test';\n\n`;
  script += `test('Reproduction: ${report.title || 'Reported Defect'}', async ({ page }) => {\n`;
  script += `  // Step 1: Navigate to page\n`;
  script += `  await page.goto('${targetUrl}');\n\n`;

  if (networkCalls.length > 0) {
    const mainCall = networkCalls[0];
    script += `  // Step 2: Set up request monitoring\n`;
    script += `  let requestCount = 0;\n`;
    script += `  page.on('request', req => {\n`;
    script += `    if (req.url().includes('${mainCall.url?.split('?')[0]}') && req.method() === '${mainCall.method || 'POST'}') {\n`;
    script += `      requestCount++;\n`;
    script += `    }\n`;
    script += `  });\n\n`;
  }

  script += `  // Step 3: Reproduce click trail\n`;
  for (const click of clicks.slice(0, 3)) {
    script += `  await page.locator('${click.selector}').click();\n`;
  }

  script += `\n  // Step 4: Verify expectations\n`;
  script += `  // Expected: ${report.expected || 'Correct behavior'}\n`;
  script += `  // Actual reported: ${report.actual || 'Defect condition'}\n`;
  if (networkCalls.length > 0) {
    script += `  await page.waitForTimeout(500);\n`;
    script += `  expect(requestCount).toBe(1); // Ensures no duplicate submission\n`;
  }

  script += `});\n`;

  return script;
}
