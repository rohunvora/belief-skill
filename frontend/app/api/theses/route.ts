import { NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const historyDir = path.resolve(process.cwd(), "../data/history");
  if (!existsSync(historyDir)) {
    return NextResponse.json([]);
  }
  
  const files = readdirSync(historyDir).filter(f => f.endsWith(".json")).sort().reverse();
  const theses = files.map(f => {
    try {
      return JSON.parse(readFileSync(path.join(historyDir, f), "utf-8"));
    } catch { return null; }
  }).filter(Boolean);
  
  return NextResponse.json(theses);
}
