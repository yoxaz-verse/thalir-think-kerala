import Link from "next/link";
import type { Locale } from "@/lib/types";

export function Mark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Thalir sprout mark"><path d="M32 54V30"/><path d="M32 35C18 35 10 27 10 14c14 0 22 8 22 21Z"/><path d="M32 29c0-13 8-21 22-21 0 13-8 21-22 21Z"/><circle cx="32" cy="54" r="4"/><circle cx="10" cy="14" r="3"/><circle cx="54" cy="8" r="3"/></svg>;
}

export function Logo({ locale, light = false }: { locale: Locale; light?: boolean }) {
  return <Link href={`/${locale}`} className={`logo ${light ? "logo--light" : ""}`} aria-label="Thalir home"><Mark/><span><strong>{locale === "ml" ? "തളിർ" : "thalir"}</strong><small>{locale === "ml" ? "തിങ്ക് കേരളയുടെ സംരംഭം" : "by Think Kerala"}</small></span></Link>;
}
