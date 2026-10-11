import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserProfile,
  updateUserProfile,
  removeUserAvatar,
} from "@/lib/user/profile-service";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => {
  const mockFindUniqueUser = vi.fn();
  const mockFindFirstUser = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockCreateAuditLog = vi.fn();

  return {
    prisma: {
      user: {
        findUnique: mockFindUniqueUser,
        findFirst: mockFindFirstUser,
        update: mockUpdateUser,
      },
      auditLog: {
        create: mockCreateAuditLog,
      },
    },
  };
});

describe("User Profile Management & Security Engine", () => {
  const mockUser = {
    id: "usr-abebe-1",
    name: "Abebe Kebede",
    email: "owner@addismart.et",
    passwordHash: "hashed_pwd",
    accountStatus: "ACTIVE",
    globalRole: "USER",
    createdAt: new Date("2026-01-01"),
    memberships: [
      {
        id: "mem-1",
        businessId: "biz-addis-1",
        role: "OWNER",
        status: "ACTIVE",
        business: {
          id: "biz-addis-1",
          name: "Addis Mini Mart",
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.user.findFirst as any).mockResolvedValue(null); // No duplicate email by default
    (prisma.user.update as any).mockImplementation(({ data }: any) => {
      return { ...mockUser, ...data };
    });
    (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-p-1" });
  });

  it("retrieves full user profile with membership details and verification status", async () => {
    const profile = await getUserProfile("usr-abebe-1", "biz-addis-1");

    expect(profile).toBeDefined();
    expect(profile.id).toBe("usr-abebe-1");
    expect(profile.email).toBe("owner@addismart.et");
    expect(profile.emailVerified).toBe(true);
    expect(profile.accountStatus).toBe("ACTIVE");
    expect(profile.activeBusiness?.name).toBe("Addis Mini Mart");
    expect(profile.activeBusiness?.role).toBe("OWNER");
  });

  it("updates personal details (name, phone, job title) safely", async () => {
    const updated = await updateUserProfile("usr-abebe-1", {
      firstName: "Abebe",
      lastName: "Kebede Junior",
      phone: "+251911998877",
      jobTitle: "Founder & General Manager",
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "usr-abebe-1" },
        data: { name: "Abebe Kebede Junior" },
      })
    );
    expect(updated.firstName).toBe("Abebe");
    expect(updated.lastName).toBe("Kebede Junior");
  });

  it("rejects invalid email formats", async () => {
    await expect(
      updateUserProfile("usr-abebe-1", {
        email: "not-an-email-address",
      })
    ).rejects.toThrow(/Invalid email address format/);
  });

  it("detects and blocks duplicate email addresses registered to another account", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "usr-other-user",
      email: "existing@other.et",
    });

    await expect(
      updateUserProfile("usr-abebe-1", {
        email: "existing@other.et",
      })
    ).rejects.toThrow(/already in use/);
  });

  it("validates profile photo data URI security and size limit", async () => {
    await expect(
      updateUserProfile("usr-abebe-1", {
        photoUrl: "invalid-url-protocol://photo.jpg",
      })
    ).rejects.toThrow(/Photo must be a valid image data URI or URL/);

    const giantAvatar = "data:image/png;base64," + "X".repeat(3.5 * 1024 * 1024);
    await expect(
      updateUserProfile("usr-abebe-1", {
        photoUrl: giantAvatar,
      })
    ).rejects.toThrow(/Photo file exceeds the 2MB size limit/);
  });

  it("removes avatar and restores default fallback", async () => {
    const profile = await removeUserAvatar("usr-abebe-1", "biz-addis-1");

    expect(profile.photoUrl).toBe("");
  });
});
