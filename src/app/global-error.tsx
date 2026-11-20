"use client"; // Error boundaries must be Client Components

/**
 * Last resort: shown when the root layout itself fails. It replaces the whole
 * document and doesn't get the app's stylesheet, so the styles are inline.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 16,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#16171c",
          color: "#fafafa",
        }}
      >
        <title>Something went wrong</title>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: 360, fontSize: 14, color: "#a1a1aa" }}>
          The app couldn&apos;t load. It&apos;s usually temporary, so try again.
        </p>
        <button
          onClick={() => retry()}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: 0,
            background: "#fafafa",
            color: "#16171c",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
