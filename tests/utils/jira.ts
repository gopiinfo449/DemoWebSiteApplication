import axios, { AxiosInstance, AxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  throw new Error(
    "Missing Jira credentials. Ensure JIRA_BASE_URL, JIRA_EMAIL and JIRA_API_TOKEN are set in .env"
  );
}

const authToken = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

const client: AxiosInstance = axios.create({
  baseURL: `${JIRA_BASE_URL}/rest/api/3`,
  headers: {
    Authorization: `Basic ${authToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ---- Minimal ADF (Atlassian Document Format) types ----

interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AdfDocument {
  type: "doc";
  version: number;
  content: AdfNode[];
}

export interface JiraTask {
  key: string;
  summary: string;
  description: string;
  labels: string[];
  status: string;
}

function logCall(action: string, detail: string): void {
  console.log(`[jira] ${action}: ${detail}`);
}

function logError(action: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = JSON.stringify(err.response?.data);
    console.error(`[jira] ${action} failed (status ${status ?? "unknown"}): ${data ?? err.message}`);
  } else {
    console.error(`[jira] ${action} failed:`, error);
  }
}

/**
 * Recursively extracts plain text from an ADF node tree.
 * Paragraphs/headings are separated by newlines.
 */
function adfToPlainText(node: AdfNode | AdfDocument | undefined | null): string {
  if (!node) return "";

  const lines: string[] = [];

  function walk(n: AdfNode): string {
    if (n.type === "text") {
      return n.text ?? "";
    }
    const childText = (n.content ?? []).map(walk).join("");
    if (n.type === "paragraph" || n.type === "heading") {
      return childText + "\n";
    }
    return childText;
  }

  const content = (node as AdfDocument).content ?? [];
  for (const child of content) {
    lines.push(walk(child));
  }

  return lines.join("").trim();
}

/**
 * Fetches all "To Do" issues for a project using JQL.
 */
export async function getTodotasks(projectKey: string): Promise<JiraTask[]> {
  const jql = `project = "${projectKey}" AND status = "To Do"`;
  logCall("getTodotasks", `project=${projectKey}`);

  try {
    const response = await client.get("/search/jql", {
      params: {
        jql,
        fields: "summary,description,labels,status",
      },
    });

    const issues = response.data.issues ?? [];

    return issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields?.summary ?? "",
      description: adfToPlainText(issue.fields?.description),
      labels: issue.fields?.labels ?? [],
      status: issue.fields?.status?.name ?? "",
    }));
  } catch (error) {
    logError("getTodotasks", error);
    throw error;
  }
}

/**
 * Fetches a single issue by key.
 */
export async function getTask(issueKey: string): Promise<JiraTask> {
  logCall("getTask", issueKey);

  try {
    const response = await client.get(`/issue/${issueKey}`, {
      params: { fields: "summary,description,labels,status" },
    });

    const issue = response.data;
    return {
      key: issue.key,
      summary: issue.fields?.summary ?? "",
      description: adfToPlainText(issue.fields?.description),
      labels: issue.fields?.labels ?? [],
      status: issue.fields?.status?.name ?? "",
    };
  } catch (error) {
    logError("getTask", error);
    throw error;
  }
}

/**
 * Fetches a single issue and returns its description as plain text.
 */
export async function getTaskDescription(issueKey: string): Promise<string> {
  logCall("getTaskDescription", issueKey);

  try {
    const response = await client.get(`/issue/${issueKey}`, {
      params: { fields: "description" },
    });

    return adfToPlainText(response.data.fields?.description);
  } catch (error) {
    logError("getTaskDescription", error);
    throw error;
  }
}

/**
 * Transitions an issue to a new status by matching the transition name
 * (e.g. "In Progress", "Done").
 */
export async function moveTask(issueKey: string, transitionName: string): Promise<void> {
  logCall("moveTask", `${issueKey} -> "${transitionName}"`);

  try {
    const response = await client.get(`/issue/${issueKey}/transitions`);
    const transitions = response.data.transitions ?? [];

    const match = transitions.find(
      (t: any) => t.name?.toLowerCase() === transitionName.toLowerCase()
    );

    if (!match) {
      const available = transitions.map((t: any) => t.name).join(", ");
      throw new Error(
        `Transition "${transitionName}" not found for ${issueKey}. Available: ${available}`
      );
    }

    await client.post(`/issue/${issueKey}/transitions`, {
      transition: { id: match.id },
    });

    console.log(`[jira] moveTask: ${issueKey} moved via transition "${match.name}" (id ${match.id})`);
  } catch (error) {
    logError("moveTask", error);
    throw error;
  }
}

/**
 * Appends a new paragraph to the bottom of an issue's description
 * without overwriting existing content.
 */
export async function updateDescription(issueKey: string, appendText: string): Promise<void> {
  logCall("updateDescription", issueKey);

  try {
    const response = await client.get(`/issue/${issueKey}`, {
      params: { fields: "description" },
    });

    const existingDescription: AdfDocument = response.data.fields?.description ?? {
      type: "doc",
      version: 1,
      content: [],
    };

    const newParagraph: AdfNode = {
      type: "paragraph",
      content: [{ type: "text", text: appendText }],
    };

    const updatedDescription: AdfDocument = {
      type: "doc",
      version: 1,
      content: [...(existingDescription.content ?? []), newParagraph],
    };

    await client.put(`/issue/${issueKey}`, {
      fields: {
        description: updatedDescription,
      },
    });

    console.log(`[jira] updateDescription: appended text to ${issueKey}`);
  } catch (error) {
    logError("updateDescription", error);
    throw error;
  }
}
