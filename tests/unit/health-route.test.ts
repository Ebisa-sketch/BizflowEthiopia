import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import { GET, HEAD } from "@/app/api/health/route";

describe("Health Check API (/api/health)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and healthy status when database is reachable", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.database.status).toBe("connected");
    expect(typeof data.database.latencyMs).toBe("number");
    expect(data.service).toBe("bizflow-ethiopia-api");
    expect(data.version).toBe("1.0.0");
    expect(typeof data.uptimeSeconds).toBe("number");
  });

  it("returns 503 and unhealthy status when database connection fails", async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.database.status).toBe("disconnected");
    expect(data.database.error).toContain("Connection refused");
  });

  it("supports HEAD request for lightweight liveness probes", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const headResponse = await HEAD();
    expect(headResponse.status).toBe(200);

    prismaMock.$queryRaw.mockRejectedValueOnce(new Error("Down"));
    const failedHead = await HEAD();
    expect(failedHead.status).toBe(503);
  });
});

