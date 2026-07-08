import { ImageResponse } from "next/og";

export const alt = "48H Hackathon · Build. Ship. Celebrate.";
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
            "radial-gradient(circle at 15% 10%, rgba(255,45,146,0.22), transparent 45%), radial-gradient(circle at 85% 90%, rgba(16,214,194,0.18), transparent 45%), #07070c",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
          }}
        >
          48H Hackathon
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#94a3b8",
            marginTop: 20,
            fontWeight: 500,
          }}
        >
          Build. Ship. Celebrate.
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#64748b",
            marginTop: 28,
          }}
        >
          Teams · Screening · Judging · Live Rankings
        </div>
      </div>
    ),
    { ...size }
  );
}
