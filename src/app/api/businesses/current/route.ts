import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors";
import {
  getBusinessSettings,
  updateBusinessSettings,
  deleteBusinessSafely,
} from "@/lib/business/settings-service";

export async function GET() {
  try {
    const { businessId, role } = await requireTenant();
    const settings = await getBusinessSettings(businessId, role);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { businessId, userId, role } = await requireTenant({
      requiredPermission: "business:manage",
    });

    const body = await request.json();
    const updated = await updateBusinessSettings(businessId, userId, role, body);

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { businessId, userId, role } = await requireTenant();
    const body = await request.json();

    const result = await deleteBusinessSafely(
      businessId,
      userId,
      role,
      body.confirmationName,
      body.reason
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
