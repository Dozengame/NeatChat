import { NextRequest, NextResponse } from "next/server";

import { publicConfigHeaders } from "@/app/config/public";
import { getServerSideConfig } from "@/app/config/server";
import { validateAccessCode } from "@/app/api/auth";

async function handle(req: NextRequest) {
  const serverConfig = getServerSideConfig();

  if (!serverConfig.needCode) {
    return NextResponse.json(
      { ok: true },
      {
        headers: publicConfigHeaders(),
      },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    accessCode?: string;
  };
  const accessCode = body.accessCode?.trim() ?? "";
  const ok = accessCode.length > 0 && validateAccessCode(accessCode);

  return NextResponse.json(
    { ok },
    {
      status: ok ? 200 : 401,
      headers: publicConfigHeaders(),
    },
  );
}

export const POST = handle;

export const runtime = "edge";
