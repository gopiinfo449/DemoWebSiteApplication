import axios, { AxiosInstance, AxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const { ZEPHYR_API_TOKEN, ZEPHYR_PROJECT_KEY, ZEPHYR_BASE_URL } = process.env;

export const zephyrConfigured = Boolean(ZEPHYR_API_TOKEN && ZEPHYR_PROJECT_KEY);

const client: AxiosInstance = axios.create({
  baseURL: ZEPHYR_BASE_URL || "https://api.zephyrscale.smartbear.com/v2",
  headers: {
    Authorization: `Bearer ${ZEPHYR_API_TOKEN ?? ""}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export type ZephyrStatus = "Pass" | "Fail" | "Blocked" | "Not Executed";

export interface ZephyrTestCycle {
  id: number;
  key: string;
}

function logCall(action: string, detail: string): void {
  console.log(`[zephyr] ${action}: ${detail}`);
}

function logError(action: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = JSON.stringify(err.response?.data);
    console.error(`[zephyr] ${action} failed (status ${status ?? "unknown"}): ${data ?? err.message}`);
  } else {
    console.error(`[zephyr] ${action} failed:`, error);
  }
}

/**
 * Creates a new Test Cycle in Zephyr Scale to group the results of one Playwright run.
 */
export async function createTestCycle(name: string): Promise<ZephyrTestCycle> {
  logCall("createTestCycle", name);

  try {
    const response = await client.post("/testcycles", {
      projectKey: ZEPHYR_PROJECT_KEY,
      name,
    });

    const { id, key } = response.data;
    logCall("createTestCycle", `created ${key} (id ${id})`);
    return { id, key };
  } catch (error) {
    logError("createTestCycle", error);
    throw error;
  }
}

/**
 * Posts a single test execution result to Zephyr Scale for a test case, under the given test cycle.
 */
export async function postExecutionResult(params: {
  testCaseKey: string;
  testCycleKey: string;
  status: ZephyrStatus;
  comment?: string;
}): Promise<void> {
  const { testCaseKey, testCycleKey, status, comment } = params;
  logCall("postExecutionResult", `${testCaseKey} -> ${status} (cycle ${testCycleKey})`);

  try {
    await client.post("/testexecutions", {
      projectKey: ZEPHYR_PROJECT_KEY,
      testCaseKey,
      testCycleKey,
      statusName: status,
      ...(comment ? { comment } : {}),
    });
  } catch (error) {
    logError("postExecutionResult", error);
    throw error;
  }
}
