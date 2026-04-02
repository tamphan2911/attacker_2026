import { NextResponse } from "next/server";

import type { ServiceResult } from "@/server/team-service";

export function unauthorizedResponse(message = "Authentication required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function serviceResultToResponse<T>(result: ServiceResult<T>) {
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
