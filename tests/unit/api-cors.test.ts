import { describe, expect, it } from "vitest";
import { getAllowedApiOrigin } from "@/lib/api-cors";

describe("API CORS origin allowlist", () => {
  it("allows local Flutter web origins during development", () => {
    expect(
      getAllowedApiOrigin("http://localhost:7357", {
        NODE_ENV: "development",
      })
    ).toBe("http://localhost:7357");
  });

  it("allows explicitly configured origins in production", () => {
    expect(
      getAllowedApiOrigin("https://mobile.example.com", {
        NODE_ENV: "production",
        MOBILE_APP_ORIGINS:
          "https://mobile.example.com,https://admin.example.com",
      })
    ).toBe("https://mobile.example.com");
  });

  it("rejects unconfigured origins in production", () => {
    expect(
      getAllowedApiOrigin("https://untrusted.example", {
        NODE_ENV: "production",
      })
    ).toBeNull();
  });

  it("rejects non-local origins in development", () => {
    expect(
      getAllowedApiOrigin("https://untrusted.example", {
        NODE_ENV: "development",
      })
    ).toBeNull();
  });

  it("does not allow a wildcard or missing origin", () => {
    expect(getAllowedApiOrigin("*", { NODE_ENV: "development" })).toBeNull();
    expect(getAllowedApiOrigin(null, { NODE_ENV: "development" })).toBeNull();
  });
});
