import { existsSync } from "node:fs";
import { delimiter } from "node:path";
import { spawn, spawnSync } from "child_process";

let cachedShellConfig: { shell: string; args: string[] } | null = null;

function findBashOnPath(): string | null {
	if (process.platform === "win32") {
		try {
			const result = spawnSync("where", ["bash.exe"], { encoding: "utf-8", timeout: 5000 });
			if (result.status === 0 && result.stdout) {
				const firstMatch = result.stdout.trim().split(/\r?\n/)[0];
				if (firstMatch && existsSync(firstMatch)) {
					return firstMatch;
				}
			}
		} catch { /* ignore */ }
		return null;
	}

	try {
		const result = spawnSync("which", ["bash"], { encoding: "utf-8", timeout: 5000 });
		if (result.status === 0 && result.stdout) {
			const firstMatch = result.stdout.trim().split(/\r?\n/)[0];
			if (firstMatch) return firstMatch;
		}
	} catch { /* ignore */ }
	return null;
}

export function getShellConfig(): { shell: string; args: string[] } {
	if (cachedShellConfig) return cachedShellConfig;

	if (process.platform === "win32") {
		const programFiles = process.env.ProgramFiles;
		const paths = [
			programFiles ? `${programFiles}\\Git\\bin\\bash.exe` : "",
			process.env["ProgramFiles(x86)"] ? `${process.env["ProgramFiles(x86)"]}\\Git\\bin\\bash.exe` : ""
		].filter(Boolean);

		for (const path of paths) {
			if (existsSync(path)) {
				cachedShellConfig = { shell: path, args: ["-c"] };
				return cachedShellConfig;
			}
		}

		const bashOnPath = findBashOnPath();
		if (bashOnPath) {
			cachedShellConfig = { shell: bashOnPath, args: ["-c"] };
			return cachedShellConfig;
		}
		throw new Error("No bash shell found on Windows.");
	}

	if (existsSync("/bin/bash")) {
		cachedShellConfig = { shell: "/bin/bash", args: ["-c"] };
		return cachedShellConfig;
	}

	const bashOnPath = findBashOnPath();
	if (bashOnPath) {
		cachedShellConfig = { shell: bashOnPath, args: ["-c"] };
		return cachedShellConfig;
	}

	cachedShellConfig = { shell: "sh", args: ["-c"] };
	return cachedShellConfig;
}

export function getShellEnv(): NodeJS.ProcessEnv {
	return { ...process.env };
}

export function sanitizeBinaryOutput(str: string): string {
	return Array.from(str)
		.filter((char) => {
			const code = char.codePointAt(0);
			if (code === undefined) return false;
			if (code === 0x09 || code === 0x0a || code === 0x0d) return true;
			if (code <= 0x1f) return false;
			if (code >= 0xfff9 && code <= 0xfffb) return false;
			return true;
		})
		.join("");
}

export function killProcessTree(pid: number): void {
	if (process.platform === "win32") {
		try {
			spawn("taskkill", ["/F", "/T", "/PID", String(pid)], { stdio: "ignore", detached: true });
		} catch { /* ignore */ }
	} else {
		try {
			process.kill(-pid, "SIGKILL");
		} catch {
			try {
				process.kill(pid, "SIGKILL");
			} catch { /* ignore */ }
		}
	}
}
