import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";
import { createTestCycle, postExecutionResult, zephyrConfigured, ZephyrStatus } from "../utils/zephyr";

const TCID_PATTERN = /@TCID:([A-Z][A-Z0-9]*-T\d+)/g;

function extractTestCaseKeys(test: TestCase): string[] {
  return [...test.title.matchAll(TCID_PATTERN)].map((match) => match[1]);
}

function mapStatus(result: TestResult): ZephyrStatus {
  switch (result.status) {
    case "passed":
      return "Pass";
    case "failed":
    case "timedOut":
      return "Fail";
    case "interrupted":
      return "Blocked";
    case "skipped":
    default:
      return "Not Executed";
  }
}

function buildComment(result: TestResult): string {
  const lines = [`Duration: ${(result.duration / 1000).toFixed(1)}s`];
  const error = result.errors[0]?.message;
  if (error) {
    lines.push(`Error: ${error.split("\n")[0]}`);
  }
  return lines.join("\n");
}

/**
 * Pushes Playwright results to Zephyr Scale as test executions under a fresh test cycle.
 * No-ops (with a one-time warning) if ZEPHYR_API_TOKEN / ZEPHYR_PROJECT_KEY aren't set,
 * so it's safe to enable without breaking runs where Zephyr isn't configured.
 * Tests are linked by tagging their title with `@TCID:<ZephyrTestCaseKey>`, e.g.
 * test("user can register a new account successfully @TCID:SCRUM-T1", ...).
 */
export default class ZephyrReporter implements Reporter {
  private cycleKey: string | null = null;
  private disabled = false;
  private synced = 0;
  private skipped: string[] = [];

  async onBegin(config: FullConfig, suite: Suite): Promise<void> {
    if (!zephyrConfigured) {
      console.warn(
        "[zephyr] ZEPHYR_API_TOKEN / ZEPHYR_PROJECT_KEY not set — skipping Zephyr sync for this run."
      );
      this.disabled = true;
      return;
    }

    const envName = process.env.TEST_ENV || "qa";
    const cycleName = `Playwright ${envName} — ${new Date().toISOString()}`;

    try {
      const cycle = await createTestCycle(cycleName);
      this.cycleKey = cycle.key;
    } catch {
      console.error("[zephyr] Could not create a test cycle — disabling Zephyr sync for this run.");
      this.disabled = true;
    }
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    if (this.disabled || !this.cycleKey) return;

    const testCaseKeys = extractTestCaseKeys(test);
    if (testCaseKeys.length === 0) {
      this.skipped.push(test.title);
      return;
    }

    for (const testCaseKey of testCaseKeys) {
      try {
        await postExecutionResult({
          testCaseKey,
          testCycleKey: this.cycleKey,
          status: mapStatus(result),
          comment: buildComment(result),
        });
        this.synced++;
      } catch {
        // Already logged by src/zephyr.ts; don't fail the test run over a Zephyr outage.
      }
    }
  }

  onEnd(result: FullResult): void {
    if (this.disabled) return;

    console.log(
      `[zephyr] Synced ${this.synced} result(s) to cycle ${this.cycleKey}. ` +
        `${this.skipped.length} test(s) had no @TCID tag and were skipped.`
    );
    if (this.skipped.length) {
      console.log(`[zephyr] Untagged tests:\n  - ${this.skipped.join("\n  - ")}`);
    }
  }
}
