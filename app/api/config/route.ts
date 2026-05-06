import { NextRequest, NextResponse } from "next/server";

import { buildPublicAppConfig, publicConfigHeaders } from "../../config/public";
import { ensureAccessDeviceCookie } from "../abuse-control";

declare global {
  type PublicAppConfig = ReturnType<typeof buildPublicAppConfig>;
  type DangerConfig = PublicAppConfig;
}

async function handle(req: NextRequest) {
  return ensureAccessDeviceCookie(
    req,
    NextResponse.json(buildPublicAppConfig(), {
      headers: publicConfigHeaders(),
    }),
  );
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
