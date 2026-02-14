import type { AgentTool } from "../types.js";
import { type Static, Type } from "@sinclair/typebox";
import { readFileSync } from "fs";
import { globSync } from "glob";
import { resolveToCwd } from "./path-utils.js";
import { DEFAULT_MAX_BYTES, formatSize, truncateHead } from "./truncate.js";

const grepSchema = Type.Object({
	pattern: Type.String({ description: "RegExp pattern to search for in file contents" }),
	path: Type.Optional(Type.String({ description: "Directory to search in (default: current directory)" })),
});

export type GrepToolInput = Static<typeof grepSchema>;

export function createGrepTool(cwd: string): AgentTool<typeof grepSchema> {
	return {
		name: "grep",
		label: "grep",
		description: "Search for text in files using a RegExp pattern.",
		parameters: grepSchema,
		execute: async (_toolCallId, { pattern, path: searchDir }) => {
			const searchPath = resolveToCwd(searchDir || ".", cwd);
			const regex = new RegExp(pattern);

			const files = globSync("**/*", {
				cwd: searchPath,
				nodir: true,
				ignore: ["**/node_modules/**", "**/.git/**"],
			});

			const results: string[] = [];
			for (const file of files) {
				try {
					const content = readFileSync(`${searchPath}/${file}`, "utf-8");
					if (regex.test(content)) {
						results.push(file);
					}
				} catch { /* skip binary or inaccessible files */ }
			}

			if (results.length === 0) {
				return { content: [{ type: "text", text: "No matches found" }] };
			}

			const rawOutput = results.join("\n");
			const truncation = truncateHead(rawOutput, { maxLines: Number.MAX_SAFE_INTEGER });

			let resultOutput = truncation.content;
			if (truncation.truncated) {
				resultOutput += `\n\n[${formatSize(DEFAULT_MAX_BYTES)} limit reached]`;
			}

			return { content: [{ type: "text", text: resultOutput }] };
		}
	};
}

export const grepTool = createGrepTool(process.cwd());
