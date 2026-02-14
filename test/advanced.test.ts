import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createReadTool } from "../src/tools/read.js";
import { createLsTool } from "../src/tools/ls.js";
import { createWriteTool } from "../src/tools/write.js";
import { createEditTool } from "../src/tools/edit.js";
import { createBashTool } from "../src/tools/bash.js";
import { rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(process.cwd(), "temp-test-dir-advanced");

describe("Advanced Standalone Tools", () => {
	beforeEach(() => {
		mkdirSync(TEST_DIR, { recursive: true });
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("should perform fuzzy edit", async () => {
		const editTool = createEditTool(TEST_DIR);
		const filePath = "test.txt";
		// Note the smart quote and trailing space
		writeFileSync(join(TEST_DIR, filePath), "Hello ‘World’ \nLine 2");
		
		// Attempt to edit using straight quotes and no trailing space
		await editTool.execute("1", { 
			path: filePath, 
			oldText: "Hello 'World'", 
			newText: "Hello 'Universe'" 
		});
		
		const content = readFileSync(join(TEST_DIR, filePath), "utf-8");
		expect(content).toContain("Hello 'Universe'");
	});

	it("should handle bash commands", async () => {
		const bashTool = createBashTool(TEST_DIR);
		const result = await bashTool.execute("2", { command: "echo 'Pi Agent'" });
		// @ts-ignore
		expect(result.content[0].text).toContain("Pi Agent");
	});

	it("should respect bash timeout", async () => {
		const bashTool = createBashTool(TEST_DIR);
		try {
			await bashTool.execute("3", { command: "sleep 10", timeout: 1 });
			expect.fail("Should have timed out");
		} catch (error: any) {
			expect(error.message).toContain("timed out");
		}
	});

	it("should prevent duplicate edits", async () => {
		const editTool = createEditTool(TEST_DIR);
		const filePath = "dup.txt";
		writeFileSync(join(TEST_DIR, filePath), "match\nmatch");
		
		try {
			await editTool.execute("4", { 
				path: filePath, 
				oldText: "match", 
				newText: "replace" 
			});
			expect.fail("Should have thrown due to multiple occurrences");
		} catch (error: any) {
			expect(error.message).toContain("Found 2 occurrences");
		}
	});
});
