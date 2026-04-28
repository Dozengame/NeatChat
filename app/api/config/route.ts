import { NextResponse } from "next/server";

import { buildPublicAppConfig, publicConfigHeaders } from "../../config/public";

declare global {
  type PublicAppConfig = ReturnType<typeof buildPublicAppConfig>;
  type DangerConfig = PublicAppConfig;
}

async function handle() {
  return NextResponse.json(buildPublicAppConfig(), {
    headers: publicConfigHeaders(),
  });
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
