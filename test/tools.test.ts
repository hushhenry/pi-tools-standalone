import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createReadTool } from "../src/tools/read.js";
import { createLsTool } from "../src/tools/ls.js";
import { createWriteTool } from "../src/tools/write.js";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(process.cwd(), "temp-test-dir");

describe("Standalone Tools", () => {
	beforeEach(() => {
		mkdirSync(TEST_DIR, { recursive: true });
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("should write and read a file", async () => {
		const writeTool = createWriteTool(TEST_DIR);
		const readTool = createReadTool(TEST_DIR);

		await writeTool.execute("1", { path: "hello.txt", content: "Hello, World!" });
		
		const result = await readTool.execute("2", { path: "hello.txt" });
		expect(result.content[0].type).toBe("text");
		// @ts-ignore
		expect(result.content[0].text).toContain("Hello, World!");
	});

	it("should list files", async () => {
		const lsTool = createLsTool(TEST_DIR);
		writeFileSync(join(TEST_DIR, "file1.txt"), "content");
		writeFileSync(join(TEST_DIR, "file2.txt"), "content");

		const result = await lsTool.execute("3", { path: "." });
		// @ts-ignore
		expect(result.content[0].text).toContain("file1.txt");
		// @ts-ignore
		expect(result.content[0].text).toContain("file2.txt");
	});
});
