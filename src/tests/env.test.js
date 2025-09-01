import { validateEnv, getEnv, resetEnvCache, envSchema } from "../config/env";

describe("Environment Configuration Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment cache before each test
    resetEnvCache();
    // Clear process.env and restore it after each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnvCache();
  });

  describe("validateEnv", () => {
    it("should validate with default values when no env vars set", () => {
      process.env = { NODE_ENV: "test" }; // Only keep test env

      const env = validateEnv({ strict: false });

      expect(env).toEqual({
        VITE_ENABLE_SHAREPOINT: "false",
        VITE_SHIFT_BACKEND: "memory",
        VITE_ENVIRONMENT: "development",
        VITE_USE_FIREBASE_EMULATOR: "false",
        VITE_FIREBASE_EMULATOR_HOST: "localhost",
        VITE_FIREBASE_EMULATOR_PORT: "8080",
      });
    });

    it("should parse valid environment variables correctly", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_ENABLE_SHAREPOINT: "true",
        VITE_SHIFT_BACKEND: "indexeddb",
        VITE_ENVIRONMENT: "production",
        VITE_FIREBASE_API_KEY: "test-key",
        VITE_FIREBASE_PROJECT_ID: "test-project",
      };

      const env = validateEnv();

      expect(env.VITE_ENABLE_SHAREPOINT).toBe("true");
      expect(env.VITE_SHIFT_BACKEND).toBe("indexeddb");
      expect(env.VITE_ENVIRONMENT).toBe("production");
      expect(env.VITE_FIREBASE_API_KEY).toBe("test-key");
      expect(env.VITE_FIREBASE_PROJECT_ID).toBe("test-project");
    });

    it("should reject invalid VITE_SHIFT_BACKEND values in strict mode", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "invalid-backend",
      };

      expect(() => {
        validateEnv({ strict: true });
      }).toThrow();
    });

    it("should reject invalid VITE_ENVIRONMENT values in strict mode", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_ENVIRONMENT: "invalid-env",
      };

      expect(() => {
        validateEnv({ strict: true });
      }).toThrow();
    });

    it("should use defaults for invalid values in non-strict mode", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "invalid-backend",
        VITE_ENVIRONMENT: "invalid-env",
      };

      // Mock console.warn to avoid test output pollution
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const env = validateEnv({ strict: false });

      expect(env.VITE_SHIFT_BACKEND).toBe("memory"); // default
      expect(env.VITE_ENVIRONMENT).toBe("development"); // default
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should cache validation results", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "indexeddb",
      };

      const env1 = validateEnv();
      const env2 = validateEnv();

      expect(env1).toBe(env2); // Same object reference (cached)
    });
  });

  describe("getEnv", () => {
    it("should return cached environment after validation", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_ENABLE_SHAREPOINT: "true",
      };

      const validatedEnv = validateEnv();
      const retrievedEnv = getEnv();

      expect(retrievedEnv).toBe(validatedEnv); // Same object reference
      expect(retrievedEnv.VITE_ENABLE_SHAREPOINT).toBe("true");
    });

    it("should validate automatically if not already validated", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "memory",
      };

      const env = getEnv();

      expect(env.VITE_SHIFT_BACKEND).toBe("memory");
    });
  });

  describe("resetEnvCache", () => {
    it("should clear the cache and allow re-validation", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "memory",
      };

      validateEnv();

      // Change environment
      process.env.VITE_SHIFT_BACKEND = "indexeddb";

      const env2 = validateEnv(); // Should return cached result
      expect(env2.VITE_SHIFT_BACKEND).toBe("memory"); // Still cached

      resetEnvCache();

      const env3 = validateEnv(); // Should re-validate
      expect(env3.VITE_SHIFT_BACKEND).toBe("indexeddb"); // New value
    });
  });

  describe("schema validation edge cases", () => {
    it("should handle optional Firebase variables correctly", () => {
      process.env = {
        NODE_ENV: "test",
        // No Firebase vars set
      };

      const env = validateEnv();

      // Firebase vars should be undefined when not set
      expect(env.VITE_FIREBASE_API_KEY).toBeUndefined();
      expect(env.VITE_FIREBASE_PROJECT_ID).toBeUndefined();
    });

    it("should accept all valid VITE_SHIFT_BACKEND values", () => {
      const validBackends = ["memory", "indexeddb", "idx", "sharepoint"];

      for (const backend of validBackends) {
        resetEnvCache();
        process.env = {
          NODE_ENV: "test",
          VITE_SHIFT_BACKEND: backend,
        };

        const env = validateEnv();
        expect(env.VITE_SHIFT_BACKEND).toBe(backend);
      }
    });

    it("should accept all valid VITE_ENVIRONMENT values", () => {
      const validEnvironments = ["development", "staging", "production"];

      for (const environment of validEnvironments) {
        resetEnvCache();
        process.env = {
          NODE_ENV: "test",
          VITE_ENVIRONMENT: environment,
        };

        const env = validateEnv();
        expect(env.VITE_ENVIRONMENT).toBe(environment);
      }
    });
  });

  describe("fail-fast integration test", () => {
    it("should fail fast when app starts with invalid environment", () => {
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "invalid-backend",
        VITE_ENVIRONMENT: "invalid-environment",
      };

      // Test that the validation throws immediately in strict mode
      expect(() => {
        validateEnv({ strict: true });
      }).toThrow("Environment validation failed");
    });

    it("should demonstrate case 1: Invalid env blocks boot", () => {
      // This simulates the App.jsx startup validation
      process.env = {
        NODE_ENV: "test",
        VITE_SHIFT_BACKEND: "completely-invalid",
      };

      let errorThrown = false;
      let errorMessage = "";

      try {
        // This is the same call made in App.jsx
        validateEnv({ strict: true });
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain("Environment validation failed");
      expect(errorMessage).toContain("VITE_SHIFT_BACKEND");
    });

    it("should demonstrate case 2: All vars documented in .env.example", () => {
      // This tests that all schema keys have corresponding documentation
      const schemaKeys = Object.keys(envSchema.shape);

      // Read .env.example content to verify all variables are documented
      const fs = require("fs");
      const path = require("path");
      const envExamplePath = path.join(__dirname, "../../.env.example");
      const envExampleContent = fs.readFileSync(envExamplePath, "utf8");

      for (const key of schemaKeys) {
        expect(envExampleContent).toContain(key);
      }

      // Verify key variables are documented
      expect(envExampleContent).toContain("VITE_ENABLE_SHAREPOINT");
      expect(envExampleContent).toContain("VITE_SHIFT_BACKEND");
      expect(envExampleContent).toContain("VITE_ENVIRONMENT");
      expect(envExampleContent).toContain("VITE_FIREBASE_API_KEY");
    });
  });
});
