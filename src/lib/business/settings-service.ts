import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";
import { AppError } from "../errors";
import { BusinessRole, hasPermission } from "../permissions";

export interface BusinessSettingsData {
  businessName: string;
  tradeName?: string;
  tin?: string;
  vatRegistered?: boolean;
  contactEmail?: string;
  phone?: string;
  address?: string;
  city?: string;
  subcity?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  logoUrl?: string;

  // Operational
  defaultPaymentMethod?: string;
  receiptFooterMessage?: string;
  autoReceiptPrint?: boolean;
  lowStockAlertEnabled?: boolean;
  lowStockThresholdDefault?: number;
  requireReasonForAdjustment?: boolean;
  allowNegativeStock?: boolean;
  showCostPriceToStaff?: boolean;

  // Notification Preferences
  notificationPrefs?: {
    lowStockAlerts: boolean;
    dailySalesSummary: boolean;
    newStaffJoined: boolean;
    expenseRecorded: boolean;
    subscriptionReminder: boolean;
    emailNotifications: boolean;
    browserNotifications: boolean;
  };
}

const SETTINGS_DIR = path.resolve(process.cwd(), ".data", "tenant-settings");

function getSettingsFilePath(businessId: string): string {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }
  return path.join(SETTINGS_DIR, `${businessId}.json`);
}

export function readStoredExtendedSettings(businessId: string): Partial<BusinessSettingsData> {
  try {
    const filePath = getSettingsFilePath(businessId);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read tenant settings file:", err);
  }
  return {};
}

export function writeStoredExtendedSettings(businessId: string, data: Partial<BusinessSettingsData>) {
  try {
    const filePath = getSettingsFilePath(businessId);
    const existing = readStoredExtendedSettings(businessId);
    const merged = { ...existing, ...data };
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
    return merged;
  } catch (err) {
    console.error("Failed to write tenant settings file:", err);
    return data;
  }
}

/**
 * Retrieve complete business profile and operational settings
 */
export async function getBusinessSettings(businessId: string, userRole: BusinessRole) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      phone: true,
      address: true,
      currency: true,
      taxNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!business || business.status !== "ACTIVE") {
    throw new AppError("Business tenant is not active or could not be found.", 404);
  }

  const extended = readStoredExtendedSettings(businessId);

  return {
    id: business.id,
    businessName: business.name,
    tradeName: extended.tradeName || business.name,
    tin: business.taxNumber || "",
    vatRegistered: extended.vatRegistered ?? false,
    contactEmail: business.contactEmail || "",
    phone: business.phone || "",
    address: business.address || "",
    city: extended.city || "Addis Ababa",
    subcity: extended.subcity || "Bole",
    timezone: extended.timezone || "Africa/Addis_Ababa",
    currency: business.currency || "ETB",
    locale: extended.locale || "en",
    logoUrl: extended.logoUrl || "",

    defaultPaymentMethod: extended.defaultPaymentMethod || "CASH",
    receiptFooterMessage:
      extended.receiptFooterMessage ||
      `Thank you for shopping at ${business.name}!`,
    autoReceiptPrint: extended.autoReceiptPrint ?? true,
    lowStockAlertEnabled: extended.lowStockAlertEnabled ?? true,
    lowStockThresholdDefault: extended.lowStockThresholdDefault ?? 5,
    requireReasonForAdjustment: extended.requireReasonForAdjustment ?? true,
    allowNegativeStock: extended.allowNegativeStock ?? false,
    showCostPriceToStaff: extended.showCostPriceToStaff ?? false,

    notificationPrefs: extended.notificationPrefs || {
      lowStockAlerts: true,
      dailySalesSummary: true,
      newStaffJoined: true,
      expenseRecorded: false,
      subscriptionReminder: true,
      emailNotifications: true,
      browserNotifications: false,
    },

    canManageBusiness: hasPermission(userRole, "business:manage"),
  };
}

/**
 * Validates and updates business settings with permission and input checks
 */
export async function updateBusinessSettings(
  businessId: string,
  userId: string,
  userRole: BusinessRole,
  input: Partial<BusinessSettingsData>
) {
  if (!hasPermission(userRole, "business:manage")) {
    throw new AppError("Access denied. 'business:manage' permission required.", 403);
  }

  const {
    businessName,
    contactEmail,
    phone,
    address,
    currency = "ETB",
    tin,
    logoUrl,
    lowStockThresholdDefault,
  } = input;

  if (businessName !== undefined) {
    if (typeof businessName !== "string" || businessName.trim().length < 2) {
      throw new AppError("Business name must be at least 2 characters long.", 400);
    }
  }

  if (currency && !["ETB", "USD", "EUR"].includes(currency.toUpperCase())) {
    throw new AppError("Unsupported currency code. Must be ETB, USD, or EUR.", 400);
  }

  if (contactEmail && contactEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      throw new AppError("Invalid contact email format.", 400);
    }
  }

  if (lowStockThresholdDefault !== undefined) {
    if (Number(lowStockThresholdDefault) < 0 || !Number.isFinite(Number(lowStockThresholdDefault))) {
      throw new AppError("Low stock threshold must be a non-negative number.", 400);
    }
  }

  if (logoUrl) {
    if (!logoUrl.startsWith("data:image/") && !logoUrl.startsWith("https://") && !logoUrl.startsWith("http://")) {
      throw new AppError("Logo must be a valid image data URI or URL.", 400);
    }
    // Limit base64 image size to 2MB (approx 2.8 million characters)
    if (logoUrl.length > 2.8 * 1024 * 1024) {
      throw new AppError("Logo file exceeds the 2MB size limit.", 400);
    }
  }

  // 1. Update Core Prisma DB record
  const updatedBusiness = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: businessName ? businessName.trim() : undefined,
      contactEmail: contactEmail ? contactEmail.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      currency: currency ? currency.trim().toUpperCase() : undefined,
      taxNumber: tin !== undefined ? tin.trim() : undefined,
    },
  });

  // 2. Persist extended settings
  writeStoredExtendedSettings(businessId, input);

  // 3. Log Audit trail
  await prisma.auditLog.create({
    data: {
      businessId,
      actorUserId: userId,
      action: "BUSINESS_SETTINGS_UPDATED",
      entityType: "Business",
      entityId: businessId,
      metadata: {
        updatedFields: Object.keys(input),
      },
    },
  });

  return getBusinessSettings(businessId, userRole);
}

/**
 * Handles safe deletion/suspension of a business with safeguards
 */
export async function deleteBusinessSafely(
  businessId: string,
  userId: string,
  userRole: BusinessRole,
  confirmationName: string,
  reason?: string
) {
  if (userRole !== "OWNER") {
    throw new AppError("Only the verified Owner can delete or deactivate this business.", 403);
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, status: true },
  });

  if (!business) {
    throw new AppError("Business not found.", 404);
  }

  if (confirmationName.trim().toLowerCase() !== business.name.trim().toLowerCase()) {
    throw new AppError(
      `Confirmation failed. You must type '${business.name}' exactly to confirm deletion.`,
      400
    );
  }

  // Mark business suspended/deactivated in database with audit record
  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: { status: "SUSPENDED" },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        actorUserId: userId,
        action: "BUSINESS_SUSPENDED_BY_OWNER",
        entityType: "Business",
        entityId: businessId,
        metadata: {
          reason: reason || "Owner requested deactivation",
          timestamp: new Date().toISOString(),
        },
      },
    });
  });

  return { success: true, message: "Business successfully deactivated." };
}
