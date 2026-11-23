import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadConfig({ search = "", stored = null } = {}) {
  vi.resetModules();
  window.history.replaceState({}, "", `/${search}`);
  localStorage.clear();
  if (stored) localStorage.setItem("vortemis.api", stored);
  return import("../../js/config.js");
}

describe("api base resolution", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("prefers the query parameter and strips trailing slashes", async () => {
    const { API_BASE } = await loadConfig({
      search: "?api=https://api.example.com/",
    });
    expect(API_BASE).toBe("https://api.example.com");
  });

  it("falls back to the stored value", async () => {
    const { API_BASE } = await loadConfig({
      stored: "https://stored.example.com",
    });
    expect(API_BASE).toBe("https://stored.example.com");
  });

  it("falls back to the page origin", async () => {
    const { API_BASE } = await loadConfig();
    expect(API_BASE).toBe("");
  });
});
