import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // HSTS: force HTTPS for 1 year (set only in production via Vercel)
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Next.js requires unsafe-inline for hydration; unsafe-eval only needed for dev
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://lh3.googleusercontent.com",
            "connect-src 'self' https://accounts.google.com https://*.supabase.co",
            "frame-src https://accounts.google.com",
            "form-action 'self'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
