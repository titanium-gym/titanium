"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1>Error</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Reintentar</button>
        </div>
      </body>
    </html>
  );
}
