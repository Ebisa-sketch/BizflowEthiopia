import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors";
import { getUserProfile, updateUserProfile } from "@/lib/user/profile-service";

export async function GET() {
  try {
    const session = await requireAuth();
    const profile = await getUserProfile(session.userId, session.businessId);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const profile = await updateUserProfile(session.userId, body, session.businessId);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
