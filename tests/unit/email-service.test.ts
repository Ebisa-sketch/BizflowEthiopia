import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail, sendPasswordResetEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email/templates";

describe("Email Service & Templates", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("passwordResetTemplate", () => {
    it("generates subject, text, and html with recipient name and resetUrl", () => {
      const template = passwordResetTemplate({
        userName: "Abebe Bikila",
        resetUrl: "https://bizflow.et/reset-password?token=sample123",
        expiresInMinutes: 60,
      });

      expect(template.subject).toContain("Reset your BizFlow Ethiopia password");
      expect(template.text).toContain("Hello Abebe Bikila,");
      expect(template.text).toContain("https://bizflow.et/reset-password?token=sample123");
      expect(template.text).toContain("60 minutes");

      expect(template.html).toContain("⚡ BizFlow Ethiopia");
      expect(template.html).toContain("Hello Abebe Bikila,");
      expect(template.html).toContain("https://bizflow.et/reset-password?token=sample123");
      expect(template.html).toContain("#00D287"); // Brand accent color
    });

    it("handles omitted userName gracefully", () => {
      const template = passwordResetTemplate({
        resetUrl: "https://bizflow.et/reset-password?token=sample456",
      });

      expect(template.text).toContain("Hello,");
      expect(template.html).toContain("Hello,");
    });
  });

  describe("sendEmail in simulation / development mode", () => {
    it("returns simulated result when neither Resend nor SMTP is configured", async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Welcome",
        html: "<p>Hello</p>",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.messageId).toContain("simulated-");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("sendEmail with Resend API", () => {
    it("dispatches via fetch when RESEND_API_KEY is present", async () => {
      process.env.RESEND_API_KEY = "re_test_123456789";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "resend-msg-999" }),
      });
      global.fetch = mockFetch;

      const result = await sendEmail({
        to: "cashier@store.et",
        subject: "Your Daily Z-Report",
        html: "<p>Summary</p>",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_123456789",
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("resend-msg-999");
    });

    it("returns error if Resend API returns non-ok status", async () => {
      process.env.RESEND_API_KEY = "re_invalid_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Unauthorized",
      });
      global.fetch = mockFetch;

      const result = await sendEmail({
        to: "cashier@store.et",
        subject: "Notice",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("sendPasswordResetEmail helper", () => {
    it("constructs and delivers the template", async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;

      const result = await sendPasswordResetEmail(
        "user@store.et",
        "https://bizflow.et/reset?token=xyz",
        "Almaz"
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });
});
