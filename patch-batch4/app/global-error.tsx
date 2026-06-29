"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#05070F", color: "#E7E9F5", fontFamily: "sans-serif" }}>
        <div
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <p style={{ fontSize: "18px", fontWeight: 600 }}>The app failed to load</p>
          <p style={{ fontSize: "14px", color: "#8E94B0", maxWidth: "320px" }}>
            Something went wrong at the root level. Try reloading.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "8px",
              padding: "10px 20px",
              borderRadius: "999px",
              background: "#6E63FF",
              color: "white",
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
