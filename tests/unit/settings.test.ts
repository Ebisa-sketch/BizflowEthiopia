import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBusinessSettings,
  updateBusinessSettings,
  deleteBusinessSafely,
} from "@/lib/business/settings-service";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => {
  const mockFindUniqueBusiness = vi.fn();
  const mockUpdateBusiness = vi.fn();
  const mockCreateAuditLog = vi.fn();
  const mockTransaction = vi.fn(async (cb) => {
    return cb({
      business: { update: mockUpdateBusiness },
      auditLog: { create: mockCreateAuditLog },
    });
  });

  return {
    prisma: {
      business: {
        findUnique: mockFindUniqueBusiness,
        update: mockUpdateBusiness,
      },
      auditLog: {
        create: mockCreateAuditLog,
      },
      $transaction: mockTransaction,
    },
  };
});

describe("Business Settings & Operational Preferences Engine", () => {
  const mockBusiness = {
    id: "biz-addis-1",
    name: "Addis Mini Mart",
    contactEmail: "info@addismart.et",
    phone: "+251911234567",
    address: "Bole Atlas, Addis Ababa",
    currency: "ETB",
    taxNumber: "TIN-001928374",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.business.findUnique as any).mockResolvedValue(mockBusiness);
    (prisma.business.update as any).mockResolvedValue(mockBusiness);
    (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-1" });
  });

  it("retrieves complete business settings with defaults", async () => {
    const settings = await getBusinessSettings("biz-addis-1", "OWNER");

    expect(settings).toBeDefined();
    expect(settings.businessName).toBe("Addis Mini Mart");
    expect(settings.currency).toBe("ETB");
    expect(settings.canManageBusiness).toBe(true);
    expect(settings.tin).toBe("TIN-001928374");
  });

  it("allows OWNER to update business profile and stores audit trail", async () => {
    const updated = await updateBusinessSettings("biz-addis-1", "usr-owner-1", "OWNER", {
      businessName: "Addis Supermarket Bole",
      phone: "+251922334455",
      tin: "TIN-9988776655",
      currency: "ETB",
    });

    expect(prisma.business.update).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(updated).toBeDefined();
  });

  it("blocks CASHIER from modifying business settings", async () => {
    await expect(
      updateBusinessSettings("biz-addis-1", "usr-cashier-1", "CASHIER", {
        businessName: "Hacked Mart",
      })
    ).rejects.toThrow(/Access denied/);
  });

  it("validates minimum length for business name", async () => {
    await expect(
      updateBusinessSettings("biz-addis-1", "usr-owner-1", "OWNER", {
        businessName: "A", // Less than 2 characters
      })
    ).rejects.toThrow(/Business name must be at least 2 characters/);
  });

  it("rejects unsupported currencies", async () => {
    await expect(
      updateBusinessSettings("biz-addis-1", "usr-owner-1", "OWNER", {
        currency: "INVALID_CURRENCY",
      })
    ).rejects.toThrow(/Unsupported currency code/);
  });

  it("validates logo upload data URI security and size limit", async () => {
    // Non-image string
    await expect(
      updateBusinessSettings("biz-addis-1", "usr-owner-1", "OWNER", {
        logoUrl: "javascript:alert(1)",
      })
    ).rejects.toThrow(/Logo must be a valid image data URI or URL/);

    // Oversized data URI (> 3MB)
    const giantString = "data:image/png;base64," + "A".repeat(3.5 * 1024 * 1024);
    await expect(
      updateBusinessSettings("biz-addis-1", "usr-owner-1", "OWNER", {
        logoUrl: giantString,
      })
    ).rejects.toThrow(/Logo file exceeds the 2MB size limit/);
  });

  it("blocks non-owners from deleting or suspending the business", async () => {
    await expect(
      deleteBusinessSafely(
        "biz-addis-1",
        "usr-mgr-1",
        "MANAGER",
        "Addis Mini Mart"
      )
    ).rejects.toThrow(/Only the verified Owner can delete/);
  });

  it("requires exact confirmation name matching before deactivating a business", async () => {
    await expect(
      deleteBusinessSafely(
        "biz-addis-1",
        "usr-owner-1",
        "OWNER",
        "Wrong Name Inc"
      )
    ).rejects.toThrow(/Confirmation failed/);

    const success = await deleteBusinessSafely(
      "biz-addis-1",
      "usr-owner-1",
      "OWNER",
      "Addis Mini Mart",
      "Closing physical branch"
    );
    expect(success.success).toBe(true);
  });
});
