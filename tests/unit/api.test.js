import { beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : status === 204 ? "No Content" : "Error",
    json: async () => body,
  };
}

async function loadApi() {
  vi.resetModules();
  window.history.replaceState({}, "", "/?api=https%3A%2F%2Fapi.example.com");
  sessionStorage.clear();
  return import("../../js/api.js");
}

describe("api client", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores the tokens returned by login", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        access_token: "a1",
        refresh_token: "r1",
        role: "admin",
      }),
    );

    const { api, tokens } = await loadApi();
    const payload = await api.login("admin", "secret");
    tokens.set(payload);

    expect(payload.role).toBe("admin");
    expect(tokens.access).toBe("a1");
    expect(tokens.refresh).toBe("r1");
  });

  it("raises ApiError on invalid credentials", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(401, { detail: "Invalid credentials" }),
    );

    const { api } = await loadApi();
    await expect(api.login("nobody", "wrong")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("attaches the bearer token to authenticated calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { username: "admin", role: "admin" }),
    );
    globalThis.fetch = fetchMock;

    const { api, tokens } = await loadApi();
    tokens.set({ access_token: "tok", refresh_token: "ref" });
    await api.me();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer tok");
  });

  it("rotates the session once on a 401 and retries", async () => {
    let meCalls = 0;
    globalThis.fetch = vi.fn(async (url) => {
      const target = String(url);
      if (target.includes("/v1/auth/me")) {
        meCalls += 1;
        return meCalls === 1
          ? jsonResponse(401, { detail: "expired" })
          : jsonResponse(200, { username: "admin", role: "admin" });
      }
      if (target.includes("/v1/auth/refresh")) {
        return jsonResponse(200, { access_token: "a2", refresh_token: "r2" });
      }
      return jsonResponse(404, {});
    });

    const { api, tokens } = await loadApi();
    tokens.set({ access_token: "a1", refresh_token: "r1" });
    const identity = await api.me();

    expect(identity.role).toBe("admin");
    expect(tokens.access).toBe("a2");
    expect(tokens.refresh).toBe("r2");
  });

  it("clears both tokens", async () => {
    const { tokens } = await loadApi();
    tokens.set({ access_token: "a", refresh_token: "r" });
    tokens.clear();

    expect(tokens.access).toBeNull();
    expect(tokens.refresh).toBeNull();
  });
});
