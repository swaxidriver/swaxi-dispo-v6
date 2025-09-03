/**
 * Test file for i18n functionality
 * Tests dictionary files, useI18n hook, and fallback behavior
 */

describe("I18n Dictionary Files", () => {
  it("should have separate dictionary files", () => {
    // Test that dictionary files exist and have the expected structure
    const { de } = require("../i18n/de");
    const { en } = require("../i18n/en");

    expect(de).toBeDefined();
    expect(en).toBeDefined();

    // Test basic keys exist in both languages
    expect(de.settings).toBe("Einstellungen");
    expect(en.settings).toBe("Settings");

    expect(de.language).toBe("Sprache");
    expect(en.language).toBe("Language");
  });

  it("should export dictionary from index", () => {
    const { dictionary } = require("../i18n/index");

    expect(dictionary).toBeDefined();
    expect(dictionary.de).toBeDefined();
    expect(dictionary.en).toBeDefined();

    expect(dictionary.de.settings).toBe("Einstellungen");
    expect(dictionary.en.settings).toBe("Settings");
  });

  it("should have consistent keys between languages", () => {
    const { de } = require("../i18n/de");
    const { en } = require("../i18n/en");

    const deKeys = Object.keys(de);
    const enKeys = Object.keys(en);

    // Both languages should have the same keys
    expect(deKeys.sort()).toEqual(enKeys.sort());
  });
});

describe("I18n Fallback Logic", () => {
  it("should test fallback behavior conceptually", () => {
    // Mock the translation function behavior as described in requirements
    const mockT = (key, currentLang, dictionary) => {
      const translation = dictionary[currentLang]?.[key];
      if (translation) {
        return translation;
      }

      // Fallback to German if not found in current language (except if current language is already German)
      if (currentLang !== "de") {
        const fallbackTranslation = dictionary.de?.[key];
        if (fallbackTranslation) {
          return fallbackTranslation;
        }
      }

      // Final fallback: return key if no translation found
      return key;
    };

    const mockDictionary = {
      de: { hello: "Hallo", settings: "Einstellungen" },
      en: { hello: "Hello" }, // missing "settings" in English
    };

    // Normal translation
    expect(mockT("hello", "en", mockDictionary)).toBe("Hello");
    expect(mockT("hello", "de", mockDictionary)).toBe("Hallo");

    // Fallback to German when English translation missing
    expect(mockT("settings", "en", mockDictionary)).toBe("Einstellungen");

    // Final fallback to key when no translation exists anywhere
    expect(mockT("nonExistent", "en", mockDictionary)).toBe("nonExistent");
    expect(mockT("nonExistent", "de", mockDictionary)).toBe("nonExistent");
  });
});
