import { z } from "zod";

export const onboardingSchema = z.object({
  role:z.enum(["founder","investor"]), fullName:z.string().trim().min(2).max(100),
  investorTier:z.enum(["community_backer","venture_investor"]).optional(), locale:z.enum(["en","ml"]),
}).refine(value => value.role !== "investor" || value.investorTier, {message:"Choose an investor tier",path:["investorTier"]});

export const projectSchema = z.object({
  name:z.string().trim().min(2).max(120), slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  problem:z.string().trim().min(20).max(1000), affectedAudience:z.string().trim().min(5).max(500), motivation:z.string().trim().min(10).max(1000),
  sector:z.string().trim().min(2).max(80), stage:z.enum(["idea","prototype","early_users","revenue","scaling"]),
  teamSize:z.coerce.number().int().min(1).max(10000), location:z.string().trim().min(2).max(120), publicPitch:z.string().trim().min(10).max(180),
});

export const messageSchema = z.object({threadId:z.string().uuid(),body:z.string().trim().min(1).max(5000)});
export const interestSchema = z.object({projectId:z.string().uuid(),note:z.string().trim().max(1000).optional()});
