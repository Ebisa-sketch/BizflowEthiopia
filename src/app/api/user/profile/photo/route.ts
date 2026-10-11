import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors";
import { removeUserAvatar } from "@/lib/user/profile-service";

export async function DELETE() {
  try {
    const session = await requireAuth();
    const profile = await removeUserAvatar(session.userId, session.businessId);

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully.",
      profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
