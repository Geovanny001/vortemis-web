import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const dom = new JSDOM(html);
const doc = dom.window.document;

describe("landing contract", () => {
  it("exposes one panel per manual tab", () => {
    const tabs = [...doc.querySelectorAll(".docs-tab")];
    const panels = [...doc.querySelectorAll(".docs-panels [data-doc]")];

    expect(tabs).toHaveLength(8);
    expect(panels).toHaveLength(8);
    for (const tab of tabs) {
      expect(
        panels.some((panel) => panel.dataset.doc === tab.dataset.doc),
      ).toBe(true);
    }
  });

  it("keeps the new and legacy sections together", () => {
    for (const id of [
      "telemetry",
      "engine",
      "how",
      "detects",
      "console",
      "interfaces",
      "run",
      "faq",
      "access",
    ]) {
      expect(doc.getElementById(id)).not.toBeNull();
    }
  });

  it("does not leak internal endpoints", () => {
    const text = doc.body.textContent;
    expect(text).not.toContain("localhost");
    expect(text).not.toContain("127.0.0.1");
    expect(text).not.toContain("192.168.");
    expect(text).not.toContain("0.0.0.0");
    expect(text).not.toContain("trycloudflare");
  });
});
