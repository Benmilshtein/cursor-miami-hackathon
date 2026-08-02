import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} · ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 18% 12%, rgba(255,122,69,0.28), transparent 42%), radial-gradient(circle at 82% 88%, rgba(46,230,197,0.22), transparent 44%), #061018",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#2ee6c5",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Cursor Miami
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: "#f4f7fb",
            letterSpacing: "-0.03em",
          }}
        >
          Ship Night
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a8b3c4",
            marginTop: 20,
            fontWeight: 500,
          }}
        >
          {siteConfig.tagline}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#6f7c90",
            marginTop: 28,
          }}
        >
          Open to every level · 4pm to midnight · Miami
        </div>
      </div>
    ),
    { ...size }
  );
}
