import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type MergeLensConfig = {
  exclude?: string[];
  sensitivePathPatterns?: string[];
  thresholds?: {
    mediumFiles?: number;
    highFiles?: number;
    mediumChanges?: number;
    highChanges?: number;
    missingTestsMinAdditions?: number;
  };
};

export type ResolvedMergeLensConfig = {
  exclude: string[];
  sensitivePathPatterns: string[];
  thresholds: {
    mediumFiles: number;
    highFiles: number;
    mediumChanges: number;
    highChanges: number;
    missingTestsMinAdditions: number;
  };
};

const DEFAULT_CONFIG: ResolvedMergeLensConfig = {
  exclude: ["**/*.lock", "**/dist/**", "**/__snapshots__/**"],
  sensitivePathPatterns: ["auth", "permission", "payment", "secret", "token", "infra"],
  thresholds: {
    mediumFiles: 12,
    highFiles: 30,
    mediumChanges: 400,
    highChanges: 1000,
    missingTestsMinAdditions: 80
  }
};

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((v): v is string => typeof v === "string");
}

export function resolveConfig(raw?: MergeLensConfig): ResolvedMergeLensConfig {
  return {
    exclude: raw?.exclude ?? DEFAULT_CONFIG.exclude,
    sensitivePathPatterns:
      raw?.sensitivePathPatterns ?? DEFAULT_CONFIG.sensitivePathPatterns,
    thresholds: {
      mediumFiles: raw?.thresholds?.mediumFiles ?? DEFAULT_CONFIG.thresholds.mediumFiles,
      highFiles: raw?.thresholds?.highFiles ?? DEFAULT_CONFIG.thresholds.highFiles,
      mediumChanges:
        raw?.thresholds?.mediumChanges ?? DEFAULT_CONFIG.thresholds.mediumChanges,
      highChanges: raw?.thresholds?.highChanges ?? DEFAULT_CONFIG.thresholds.highChanges,
      missingTestsMinAdditions:
        raw?.thresholds?.missingTestsMinAdditions ??
        DEFAULT_CONFIG.thresholds.missingTestsMinAdditions
    }
  };
}

export function loadConfig(cwd: string): ResolvedMergeLensConfig {
  const path = join(cwd, "mergelens.config.json");

  if (!existsSync(path)) {
    return resolveConfig();
  }

  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    return resolveConfig({
      exclude: asStringArray(data.exclude),
      sensitivePathPatterns: asStringArray(data.sensitivePathPatterns),
      thresholds:
        typeof data.thresholds === "object" && data.thresholds !== null
          ? (data.thresholds as MergeLensConfig["thresholds"])
          : undefined
    });
  } catch {
    return resolveConfig();
  }
}

export function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "::DOUBLE_STAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DOUBLE_STAR::/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function shouldExclude(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}
