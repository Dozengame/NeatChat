import { ModelProvider } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { withUsageAccounting } from "./abuse-control";
import { auth, authErrorResponse } from "./auth";
import { requestOpenai } from "./common";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[Azure Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const subpath = params.path.join("/");

  const authResult = await auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return authErrorResponse(authResult);
  }

  try {
    return await withUsageAccounting(req, await requestOpenai(req));
  } catch (e) {
    console.error("[Azure] ", e);
    return NextResponse.json(prettyObject(e));
  }
}
