import { Environment } from "./types";
import { qaEnv } from "./qa";
import { devEnv } from "./dev";
import { stageEnv } from "./stage";

const environments: Record<string, Environment> = {
  dev: devEnv,
  stage: stageEnv,
  qa: qaEnv,
};

const resolvedEnvName = (process.env.TEST_ENV || "qa").toLowerCase();
const selected = environments[resolvedEnvName];

if (!selected) {
  throw new Error(
    `Unknown TEST_ENV "${resolvedEnvName}". Valid options: ${Object.keys(environments).join(", ")}`
  );
}

export const env: Environment = selected;
export const envName: string = resolvedEnvName;
