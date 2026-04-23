import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Project Structure Tests
 * Validates files and directories required for the app to work
 */

describe("Project Structure", () => {
  const projectRoot = process.cwd();

  it("essential files exist", () => {
    const essential = [
      "package.json",
      "next.config.ts",
      "tsconfig.json",
      ".env.example",
      "playwright.config.ts",
      "vitest.config.ts",
    ];

    essential.forEach((file) => {
      const filePath = path.join(projectRoot, file);
      expect(fs.existsSync(filePath)).toBe(
        true,
        `Missing: ${file}`
      );
    });
  });

  it("src directory structure is correct", () => {
    const dirs = [
      "src",
      "src/app",
      "src/components",
      "src/lib",
      "src/tests",
      "src/tests/unit",
      "src/tests/e2e",
      "supabase",
      "supabase/migrations",
    ];

    dirs.forEach((dir) => {
      const dirPath = path.join(projectRoot, dir);
      expect(fs.existsSync(dirPath)).toBe(
        true,
        `Missing directory: ${dir}`
      );
    });
  });

  it("database scripts exist", () => {
    const scripts = [
      "supabase/drop-all.sql",
      "supabase/migrations/001_complete_schema.sql",
      "supabase/seed_demo.sql",
    ];

    scripts.forEach((script) => {
      const scriptPath = path.join(projectRoot, script);
      expect(fs.existsSync(scriptPath)).toBe(
        true,
        `Missing script: ${script}`
      );
    });
  });

  it("main page files exist", () => {
    const pages = [
      "src/app/page.tsx",
      "src/app/layout.tsx",
      "src/app/login/page.tsx",
      "src/app/dashboard/page.tsx",
      "src/app/dashboard/layout.tsx",
    ];

    pages.forEach((page) => {
      const pagePath = path.join(projectRoot, page);
      expect(fs.existsSync(pagePath)).toBe(
        true,
        `Missing page: ${page}`
      );
    });
  });

  it("API routes exist", () => {
    const routes = [
      "src/app/api/members/route.ts",
      "src/app/api/auth/[...nextauth]/route.ts",
    ];

    routes.forEach((route) => {
      const routePath = path.join(projectRoot, route);
      expect(fs.existsSync(routePath)).toBe(
        true,
        `Missing route: ${route}`
      );
    });
  });
});

/**
 * File Content Validation Tests
 */
describe("File Content Validation", () => {
  const projectRoot = process.cwd();

  it("page.tsx includes dynamic='force-dynamic'", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "src/app/page.tsx"),
      "utf-8"
    );
    expect(content).toContain('dynamic = "force-dynamic"');
  });

  it("page.tsx includes redirect to /login", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "src/app/page.tsx"),
      "utf-8"
    );
    expect(content).toContain('redirect("/login")');
  });

  it(".env.example contains BYPASS_AUTH", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, ".env.example"),
      "utf-8"
    );
    expect(content).toContain("BYPASS_AUTH");
  });

  it(".env.example contains SUPABASE_URL", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, ".env.example"),
      "utf-8"
    );
    expect(content).toContain("SUPABASE_URL");
  });

  it("next.config.ts exports valid config", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "next.config.ts"),
      "utf-8"
    );
    expect(content).toContain("export default");
  });

  it("middleware.ts exists and is valid", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "src/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain("export");
  });
});

/**
 * SQL Script Validation Tests
 */
describe("Database Scripts", () => {
  const projectRoot = process.cwd();

  it("drop-all.sql has correct structure", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "supabase/drop-all.sql"),
      "utf-8"
    );
    expect(content).toContain("DROP");
    expect(content).toContain("members");
  });

  it("001_complete_schema.sql includes RLS policies", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "supabase/migrations/001_complete_schema.sql"),
      "utf-8"
    );
    expect(content).toContain("CREATE POLICY");
    expect(content).toContain("public_read_members");
  });

  it("001_complete_schema.sql uses CURRENT_TIMESTAMP", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "supabase/migrations/001_complete_schema.sql"),
      "utf-8"
    );
    expect(content).toContain("CURRENT_TIMESTAMP");
  });

  it("seed_demo.sql contains 100 inserts", () => {
    const content = fs.readFileSync(
      path.join(projectRoot, "supabase/seed_demo.sql"),
      "utf-8"
    );
    // Should have 100 INSERT lines
    const insertCount = (content.match(/INSERT INTO members/g) || []).length;
    expect(insertCount).toBeGreaterThan(0);
  });
});
