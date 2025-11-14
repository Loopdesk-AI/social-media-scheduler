import { describe, test, expect } from "vitest";
import { evaluateLimit, getLength } from "./postUtils";

describe("postUtils", () => {
  test("getLength counts characters", () => {
    expect(getLength("hello")).toBe(5);
    expect(getLength("")).toBe(0);
  });

  test("evaluateLimit returns ok/warning/error", () => {
    const limit = 10;
    expect(evaluateLimit("12345", limit).state).toBe("ok");
    expect(evaluateLimit("12345678", limit).state).toBe("ok");
    // 9/10 -> 90% hits warning
    expect(evaluateLimit("123456789", limit).state).toBe("warning");
    // 10/10 -> 100% -> warning (not error until exceeded)
    expect(evaluateLimit("1234567890", limit).state).toBe("warning");
    expect(evaluateLimit("12345678901", limit).state).toBe("error");
  });
});
