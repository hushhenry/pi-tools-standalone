import { spawnSync } from "child_process";

export async function ensureTool(name: string): Promise<string> {
    // Check if the tool is on the path
    const checkCmd = process.platform === "win32" ? "where" : "which";
    const result = spawnSync(checkCmd, [name], { encoding: "utf-8" });
    if (result.status === 0 && result.stdout) {
        return name; // Use the tool from path
    }
    // Fallback: throw or return something that will fail gracefully
    throw new Error(`Tool ${name} not found on system path.`);
}
