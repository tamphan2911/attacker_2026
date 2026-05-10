import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { error: "Round 1 essay scores are entered only by the assigned judge." },
    { status: 403 },
  );
}
