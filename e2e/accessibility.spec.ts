import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

for(const path of ["/en","/ml","/en/ecosystem","/en/privacy"]){test(`has no serious accessibility violations on ${path}`,async({page})=>{await page.emulateMedia({reducedMotion:"reduce"});await page.goto(path);await page.locator("main").waitFor();const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();expect(results.violations.filter((violation)=>["serious","critical"].includes(violation.impact??""))).toEqual([])})}
