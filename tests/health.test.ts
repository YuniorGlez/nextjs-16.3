import { describe, it, expect, afterEach } from "vitest";

const originalUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalUrl;
});

describe("GET /api/health", () => {
  it("returns degraded with db unconfigured when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { GET } = await import("../src/app/api/health/route");
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("unconfigured");
    expect(typeof body.timestamp).toBe("string");
  });
});
