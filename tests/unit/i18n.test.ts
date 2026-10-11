import { describe, it, expect } from "vitest";
import { translations, SupportedLanguage } from "@/lib/i18n/translations";

describe("i18n Multi-Language System", () => {
  const languages: SupportedLanguage[] = ["EN", "AM", "OR"];

  it("defines translation dictionaries for all supported languages", () => {
    expect(translations.EN).toBeDefined();
    expect(translations.AM).toBeDefined();
    expect(translations.OR).toBeDefined();
  });

  it("contains all critical auth keys across EN, AM, and OR", () => {
    const requiredAuthKeys = [
      "auth.welcomeBack",
      "auth.signIn",
      "auth.email",
      "auth.password",
      "auth.confirmPassword",
      "auth.createAccount",
      "auth.createYourAccount",
      "auth.firstName",
      "auth.lastName",
      "auth.phone",
      "auth.optional",
      "auth.termsOfService",
      "auth.privacyPolicy",
      "auth.passwordRequirements",
      "auth.characters8",
      "auth.number1",
      "auth.letters",
      "auth.passwordsMatch",
      "auth.brandHeadline",
      "auth.benefit1Title",
      "auth.benefit2Title",
      "auth.benefit3Title",
    ];

    for (const lang of languages) {
      for (const key of requiredAuthKeys) {
        expect(translations[lang][key], `Missing key "${key}" in language "${lang}"`).toBeDefined();
        expect(translations[lang][key].length, `Empty string for key "${key}" in language "${lang}"`).toBeGreaterThan(0);
      }
    }
  });

  it("contains all navigation items across EN, AM, and OR", () => {
    const requiredNavKeys = [
      "nav.dashboard",
      "nav.pos",
      "nav.sales",
      "nav.products",
      "nav.inventory",
      "nav.expenses",
      "nav.reports",
      "nav.staff",
      "nav.subscription",
      "nav.settings",
      "nav.activeShop",
      "nav.live",
    ];

    for (const lang of languages) {
      for (const key of requiredNavKeys) {
        expect(translations[lang][key], `Missing nav key "${key}" in language "${lang}"`).toBeDefined();
      }
    }
  });

  it("uses proper Amharic (Ethiopic) script for AM translations", () => {
    const amharicRegex = /[\u1200-\u137F]/;
    expect(amharicRegex.test(translations.AM["auth.firstName"])).toBe(true);
    expect(translations.AM["auth.firstName"]).toBe("ስም");
    expect(translations.AM["auth.lastName"]).toBe("የአባት ስም");
    expect(translations.AM["auth.createYourAccount"]).toBe("የእርስዎን መለያ ይፍጠሩ");
    expect(translations.AM["nav.dashboard"]).toBe("ዳሽቦርድ");
  });

  it("uses proper Afaan Oromoo terms for OR translations", () => {
    expect(translations.OR["auth.firstName"]).toBe("Maqaa");
    expect(translations.OR["auth.lastName"]).toBe("Maqaa Abbaa");
    expect(translations.OR["auth.createYourAccount"]).toBe("Herrega keessan bannaadhaa");
    expect(translations.OR["nav.dashboard"]).toBe("Daashboordii");
    expect(translations.OR["nav.pos"]).toBe("Gurgurtaa (POS)");
  });
});
