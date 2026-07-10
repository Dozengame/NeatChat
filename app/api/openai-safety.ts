import type { NextRequest } from "next/server";

import { isGpt56Model } from "@/app/utils/openai-responses";
import { getVerifiedAccessDeviceId } from "./abuse-control";

export function sanitizeOpenAIResponsesSafetyIdentifier<
  T extends Record<string, unknown>,
>(body: T, verifiedDeviceId?: string) {
  const sanitizedBody: Record<string, unknown> = { ...body };
  delete sanitizedBody.safety_identifier;

  const model =
    typeof sanitizedBody.model === "string" ? sanitizedBody.model : undefined;
  if (
    isGpt56Model(model) &&
    verifiedDeviceId &&
    verifiedDeviceId.length <= 64
  ) {
    sanitizedBody.safety_identifier = verifiedDeviceId;
  }

  return sanitizedBody as T & { safety_identifier?: string };
}

export async function applyOpenAISafetyIdentifier(
  req: NextRequest,
  body: Record<string, unknown>,
) {
  return sanitizeOpenAIResponsesSafetyIdentifier(
    body,
    await getVerifiedAccessDeviceId(req),
  );
}
