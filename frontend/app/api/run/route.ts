import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { thesis, budget = 20000 } = await req.json();
    if (!thesis) {
      return NextResponse.json({ error: "thesis required" }, { status: 400 });
    }

    const scriptDir = path.resolve(process.cwd(), "..");
    const safeTh = thesis.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    const cmd = `cd "${scriptDir}" && /Users/jamie/.bun/bin/bun run scripts/router.ts "${safeTh}" --budget ${budget} --save 2>/dev/null`;
    
    const { stdout } = await execAsync(cmd, { timeout: 60000 });
    
    return NextResponse.json({ output: stdout.trim(), saved: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
