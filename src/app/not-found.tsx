import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        color: "#fff",
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "7rem",
          fontWeight: 800,
          lineHeight: 1,
          margin: 0,
          background: "linear-gradient(135deg, #60a5fa, #34d399)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: "1.25rem",
          color: "#94a3b8",
          marginTop: "0.75rem",
          marginBottom: "2rem",
          maxWidth: "28rem",
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.75rem",
          borderRadius: "0.5rem",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.95rem",
          textDecoration: "none",
          transition: "opacity 0.2s",
        }}
      >
        ← Back to Home
      </Link>

      <p
        style={{
          marginTop: "3rem",
          fontSize: "0.8rem",
          color: "#475569",
        }}
      >
        BizFlow Ethiopia
      </p>
    </div>
  );
}
