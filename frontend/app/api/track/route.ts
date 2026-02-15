import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  
  try {
    const scriptDir = path.resolve(process.cwd(), "..");
    const cmd = id
      ? `/Users/jamie/.bun/bin/bun run scripts/track.ts ${id} 2>/dev/null`
      : `/Users/jamie/.bun/bin/bun run scripts/track.ts 2>/dev/null`;
    
    const { stdout } = await execAsync(cmd, { timeout: 30000, cwd: scriptDir });
    return NextResponse.json({ output: stdout.trim() });
  } catch (e: any) {
    return NextResponse.json({ output: e.stdout?.trim() || "Error tracking", error: e.message });
  }
}
