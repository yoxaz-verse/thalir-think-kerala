import { describe, expect, it } from "vitest";
import { isGoogleFormUrl } from "./site-config";

describe("external form validation",()=>{it("allows only secure Google Forms",()=>{expect(isGoogleFormUrl("https://forms.gle/abc")).toBe(true);expect(isGoogleFormUrl("https://docs.google.com/forms/d/e/abc/viewform")).toBe(true);expect(isGoogleFormUrl("https://evil.example/forms.gle/abc")).toBe(false);expect(isGoogleFormUrl("http://forms.gle/abc")).toBe(false);expect(isGoogleFormUrl(undefined)).toBe(false)})});
