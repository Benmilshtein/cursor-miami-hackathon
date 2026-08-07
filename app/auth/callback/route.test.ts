import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockGetOptionalSessionUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
    },
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getOptionalSessionUser: (...args: unknown[]) =>
    mockGetOptionalSessionUser(...args),
}));

function callbackRequest(query: string): Request {
  return new Request(`https://app.example.com/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyOtp.mockResolvedValue({ error: null });
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetOptionalSessionUser.mockResolvedValue({ role: "participant" });
  });

  it("activates the session from an email token_hash link", async () => {
    const res = await GET(callbackRequest("?token_hash=abc123&type=signup"));

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: "signup",
      token_hash: "abc123",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://app.example.com/dashboard");
  });

  it("sends each role to its own dashboard", async () => {
    mockGetOptionalSessionUser.mockResolvedValue({ role: "judge" });

    const res = await GET(callbackRequest("?token_hash=abc123&type=invite"));

    expect(res.headers.get("location")).toBe("https://app.example.com/staff");
  });

  it("sends a recovery link to the set-new-password page", async () => {
    mockGetOptionalSessionUser.mockResolvedValue({ role: "judge" });

    const res = await GET(callbackRequest("?token_hash=abc123&type=recovery"));

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "abc123",
    });
    expect(res.headers.get("location")).toBe(
      "https://app.example.com/auth/reset-password",
    );
  });

  it("still supports the OAuth/PKCE code exchange", async () => {
    const res = await GET(callbackRequest("?code=xyz789"));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("xyz789");
    expect(res.headers.get("location")).toBe("https://app.example.com/dashboard");
  });

  it("explains the failure when the link is expired", async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: "Token has expired" } });

    const res = await GET(callbackRequest("?token_hash=stale&type=signup"));

    expect(res.headers.get("location")).toBe(
      "https://app.example.com/register?error=link_invalid",
    );
  });

  it("explains the failure when the link carries no credentials", async () => {
    const res = await GET(callbackRequest(""));

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://app.example.com/register?error=link_invalid",
    );
  });

  it("ignores an unrecognized otp type instead of trusting it", async () => {
    const res = await GET(callbackRequest("?token_hash=abc&type=bogus"));

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://app.example.com/register?error=link_invalid",
    );
  });
});
