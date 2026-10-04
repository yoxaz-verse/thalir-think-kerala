import {describe,expect,it} from "vitest";
import {mapDatabaseError} from "./action-result";
import {getSupabaseProjectRef} from "./supabase/config";

describe("production pilot boundaries",()=>{
  it("extracts and compares Supabase project identities",()=>{expect(getSupabaseProjectRef("https://previewref.supabase.co")).toBe("previewref");expect(getSupabaseProjectRef("http://127.0.0.1:54321")).toBe("local");expect(getSupabaseProjectRef("not-a-url")).toBe("")});
  it("maps database errors to stable public codes",()=>{expect(mapDatabaseError("P0001: QUOTA_EXHAUSTED")).toBe("QUOTA_EXHAUSTED");expect(mapDatabaseError("details from postgres")).toBe("UNAVAILABLE")});
});
