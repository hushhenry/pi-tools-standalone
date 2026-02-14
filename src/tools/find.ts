import type { AgentTool } from "../types.js";
import { type Static, Type } from "@sinclair/typebox";
import { existsSync } from "fs";
import { globSync } from "glob";
import path from "path";
import { resolveToCwd } from "./path-utils.js";
import { DEFAULT_MAX_BYTES, formatSize, type TruncationResult, truncateHead } from "./truncate.js";

const findSchema = Type.Object({
	pattern: Type.String({
		description: "Glob pattern to match files, e.g. '*.ts', '**/*.json', or 'src/**/*.spec.ts'",
	}),
	path: Type.Optional(Type.String({ description: "Directory to search in (default: current directory)" })),
	limit: Type.Optional(Type.Number({ description: "Maximum number of results (default: 1000)" })),
});

export type FindToolInput = Static<typeof findSchema>;
const DEFAULT_LIMIT = 1000;

export function createFindTool(cwd: string): AgentTool<typeof findSchema> {
	return {
		name: "find",
		label: "find",
		description: `Search for files by glob pattern. Returns matching file paths relative to the search directory. Output is truncated to ${DEFAULT_LIMIT} results or ${DEFAULT_MAX_BYTES / 1024}KB.`,
		parameters: findSchema,
		execute: async (_toolCallId, { pattern, path: searchDir, limit }) => {
			const searchPath = resolveToCwd(searchDir || ".", cwd);
			const effectiveLimit = limit ?? DEFAULT_LIMIT;

			if (!existsSync(searchPath)) {
				throw new Error(`Path not found: ${searchPath}`);
			}

			const results = globSync(pattern, {
				cwd: searchPath,
				dot: true,
				ignore: ["**/node_modules/**", "**/.git/**"],
			});

			if (results.length === 0) {
				return { content: [{ type: "text", text: "No files found matching pattern" }] };
			}

			const limited = results.slice(0, effectiveLimit);
			const rawOutput = limited.join("\n");
			const truncation = truncateHead(rawOutput, { maxLines: Number.MAX_SAFE_INTEGER });

			let resultOutput = truncation.content;
			if (results.length > effectiveLimit) {
				resultOutput += `\n\n[${effectiveLimit} results limit reached]`;
			}
			if (truncation.truncated) {
				resultOutput += `\n\n[${formatSize(DEFAULT_MAX_BYTES)} limit reached]`;
			}

			return { content: [{ type: "text", text: resultOutput }] };
		}
	};
}

export const findTool = createFindTool(process.cwd());
