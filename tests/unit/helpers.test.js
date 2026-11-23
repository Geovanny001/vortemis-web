import { describe, expect, it } from "vitest";

import { formatClock, formatInt, formatRate, tacticName } from "../../js/ui.js";

describe("ui helpers", () => {
  it("formats integers with thousands separators", () => {
    expect(formatInt(1234567)).toBe("1,234,567");
    expect(formatInt(undefined)).toBe("0");
  });

  it("formats rates and guards against a zero total", () => {
    expect(formatRate(1, 4)).toBe("25.0%");
    expect(formatRate(0, 0)).toBe("0.0%");
  });

  it("maps MITRE tactic ids to names", () => {
    expect(tacticName("TA0010")).toBe("Exfiltration");
    expect(tacticName("TA9999")).toBe("TA9999");
    expect(tacticName(null)).toBe("None");
  });

  it("formats a clock value", () => {
    expect(typeof formatClock("2026-01-01T00:00:00Z")).toBe("string");
  });
});
