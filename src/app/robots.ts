import type { MetadataRoute } from "next";

// App de acceso privado: se bloquea toda indexación por buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
