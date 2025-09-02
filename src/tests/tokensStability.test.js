import { promises as fs } from "fs";
import path from "path";

describe("Design Tokens Stability", () => {
  test("tokens.json snapshot remains stable", async () => {
    // Read the generated tokens.json file
    const tokensPath = path.resolve("src/styles/tokens.json");
    const tokensContent = await fs.readFile(tokensPath, "utf8");
    const tokens = JSON.parse(tokensContent);

    // Remove volatile metadata for stable snapshots
    const stableTokens = {
      ...tokens,
      meta: {
        ...tokens.meta,
        generated: "[timestamp]", // Replace with stable placeholder
      },
    };

    // Snapshot test to catch accidental token changes
    expect(stableTokens).toMatchSnapshot();
  });

  test("tokens.json structure is valid", async () => {
    const tokensPath = path.resolve("src/styles/tokens.json");
    const tokensContent = await fs.readFile(tokensPath, "utf8");
    const tokens = JSON.parse(tokensContent);

    // Validate required structure
    expect(tokens).toHaveProperty("meta");
    expect(tokens).toHaveProperty("light");
    expect(tokens).toHaveProperty("dark");

    // Validate metadata
    expect(tokens.meta).toHaveProperty("generated");
    expect(tokens.meta).toHaveProperty("source");
    expect(tokens.meta).toHaveProperty("version");

    // Validate light theme has expected categories
    expect(tokens.light).toHaveProperty("colors");
    expect(tokens.light).toHaveProperty("typography");
    expect(tokens.light).toHaveProperty("spacing");
    expect(tokens.light).toHaveProperty("borders");
    expect(tokens.light).toHaveProperty("shadows");

    // Validate dark theme has colors (minimum requirement)
    expect(tokens.dark).toHaveProperty("colors");

    // Check we have essential color tokens
    const essentialColors = [
      "color-primary",
      "color-accent",
      "color-bg",
      "color-surface",
      "color-text",
    ];
    essentialColors.forEach((color) => {
      expect(tokens.light.colors).toHaveProperty(color);
      expect(tokens.dark.colors).toHaveProperty(color);
    });

    // Check typography tokens
    expect(tokens.light.typography).toHaveProperty("font-sans");
    expect(tokens.light.typography).toHaveProperty("font-mono");

    // Check spacing tokens
    expect(tokens.light.spacing).toHaveProperty("space-1");
    expect(tokens.light.spacing).toHaveProperty("space-4");

    // Check border radius tokens
    expect(tokens.light.borders).toHaveProperty("radius-sm");
    expect(tokens.light.borders).toHaveProperty("radius-md");
  });

  test("tokens.json matches CSS variables", async () => {
    const tokensPath = path.resolve("src/styles/tokens.json");
    const cssPath = path.resolve("src/styles/tokens.css");

    const [tokensContent, cssContent] = await Promise.all([
      fs.readFile(tokensPath, "utf8"),
      fs.readFile(cssPath, "utf8"),
    ]);

    const tokens = JSON.parse(tokensContent);

    // Check that primary color in JSON matches CSS
    expect(cssContent).toContain(
      `--color-primary: ${tokens.light.colors["color-primary"]}`,
    );
    expect(cssContent).toContain(
      `--color-accent: ${tokens.light.colors["color-accent"]}`,
    );

    // Check dark theme
    expect(cssContent).toContain(tokens.dark.colors["color-primary"]);
    expect(cssContent).toContain(tokens.dark.colors["color-bg"]);

    // Check typography
    expect(cssContent).toContain(tokens.light.typography["font-sans"]);

    // Check spacing
    expect(cssContent).toContain(
      `--space-1: ${tokens.light.spacing["space-1"]}`,
    );
    expect(cssContent).toContain(
      `--space-4: ${tokens.light.spacing["space-4"]}`,
    );
  });
});
