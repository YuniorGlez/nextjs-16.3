import { afterEach, describe, expect, it } from "vitest";
import { issuePreviewToken, verifyPreviewToken } from "@/lib/preview";

afterEach(() => {
  delete process.env.PREVIEW_SECRET;
  delete process.env.ADMIN_SECRET;
});

describe("preview privado", () => {
  it("firma y verifica el slug correcto", () => {
    process.env.PREVIEW_SECRET = "test-secret";
    const token = issuePreviewToken("sobre", 1_000, 100);
    expect(verifyPreviewToken(token, "sobre", 1_050)?.slug).toBe("sobre");
    expect(verifyPreviewToken(token, "otra", 1_050)).toBeNull();
  });

  it("rechaza expiración y manipulación", () => {
    process.env.PREVIEW_SECRET = "test-secret";
    const token = issuePreviewToken("sobre", 1_000, 100);
    expect(verifyPreviewToken(token, "sobre", 1_101)).toBeNull();
    const [version, , signature] = token.split(".");
    const tampered = `${version}.${Buffer.from(JSON.stringify({ slug: "sobre", exp: 9999999999999 })).toString("base64url")}.${signature}`;
    expect(verifyPreviewToken(tampered, "sobre", 1_050)).toBeNull();
    expect(verifyPreviewToken(`${token}x`, "sobre", 1_050)).toBeNull();
  });
});
