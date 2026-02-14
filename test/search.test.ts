import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createFindTool } from "../src/tools/find.js";
import { createGrepTool } from "../src/tools/grep.js";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(process.cwd(), "temp-test-dir-search");

describe("Search Tools", () => {
	beforeEach(() => {
		mkdirSync(TEST_DIR, { recursive: true });
		mkdirSync(join(TEST_DIR, "subdir"), { recursive: true });
		writeFileSync(join(TEST_DIR, "file1.txt"), "hello world");
		writeFileSync(join(TEST_DIR, "subdir/file2.txt"), "hello pi");
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("should find files by pattern", async () => {
		const findTool = createFindTool(TEST_DIR);
		const result = await findTool.execute("1", { pattern: "**/*.txt" });
		// @ts-ignore
		expect(result.content[0].text).toContain("file1.txt");
		// @ts-ignore
		expect(result.content[0].text).toContain("subdir/file2.txt");
	});

	it("should grep for text", async () => {
		const grepTool = createGrepTool(TEST_DIR);
		const result = await grepTool.execute("2", { pattern: "world" });
		// @ts-ignore
		expect(result.content[0].text).toContain("file1.txt");
		// @ts-ignore
		expect(result.content[0].text).not.toContain("file2.txt");
	});
});
