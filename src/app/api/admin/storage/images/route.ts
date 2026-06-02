import { NextResponse } from "next/server";

import {
  deleteAdminStorageImage,
  readAdminStorageImages,
} from "@/server/admin-storage";
import { getCurrentDbUser, hasAdminRole, hasElevatedRole } from "@/server/auth-helpers";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json(await readAdminStorageImages(), { status: 200 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can delete uploaded images." }, { status: 403 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim() ?? "";
  const storageKey = url.searchParams.get("key")?.trim() ?? "";
  if (!category || !storageKey) {
    return NextResponse.json({ error: "Image category and storage key are required." }, { status: 400 });
  }

  const result = await deleteAdminStorageImage(category, storageKey);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, references: result.references ?? [] },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
