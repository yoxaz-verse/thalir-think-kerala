import { ImageResponse } from "next/og";

export const alt = "Thalir by Think Kerala — Where bold ideas take root";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", background: "#f5f0e5", color: "#123d2d", padding: 70, alignItems: "center", justifyContent: "space-between", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 760 }}>
        <div style={{ display: "flex", fontSize: 28, textTransform: "uppercase", letterSpacing: 4, color: "#a84f2a" }}>Kerala&apos;s startup ecosystem</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1, marginTop: 40 }}>Where bold ideas take root.</div>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 34, marginTop: 55 }}>thalir <span style={{ fontSize: 22, marginLeft: 12 }}>by Think Kerala</span></div>
      </div>
      <div style={{ display: "flex", width: 290, height: 290, borderRadius: 200, background: "#d8f04b", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", width: 18, height: 155, background: "#123d2d", borderRadius: 20, transform: "translateY(40px)" }}/>
        <div style={{ display: "flex", width: 100, height: 140, background: "#123d2d", borderRadius: "100px 10px 100px 10px", transform: "translate(-12px,-40px) rotate(-20deg)" }}/>
      </div>
    </div>,
    size,
  );
}
