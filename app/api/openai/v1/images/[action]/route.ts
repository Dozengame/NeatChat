import { type NextRequest, NextResponse } from "next/server";
import { handle as openaiHandler } from "../../../../openai";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: { action: string } },
) {
  return openaiHandler(req, {
    params: {
      path: ["v1", "images", params.action],
    },
  });
}

export function OPTIONS() {
  return NextResponse.json({ body: "OK" }, { status: 200 });
}
