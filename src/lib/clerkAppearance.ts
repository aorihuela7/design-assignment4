import type { NextClerkProviderProps } from "@clerk/nextjs/types";

// Clerk's sign-in, sign-up and account menu in the Departures theme, from the same
// color tokens as the rest of the app. Text inherits B612 from the page.
export const clerkAppearance: NextClerkProviderProps["appearance"] = {
  // Clerk's styles go in their own CSS layer, so the app's focus ring and
  // utility classes come after them (see globals.css).
  cssLayerName: "clerk",
  variables: {
    // Continue is the primary action, so it's the only thing in the accent.
    colorPrimary: "var(--color-accent)",
    colorPrimaryForeground: "var(--color-white)",
    colorForeground: "var(--color-ink)",
    colorMutedForeground: "var(--color-muted)",
    colorBackground: "var(--color-surface)",
    colorInput: "var(--color-surface)",
    colorInputForeground: "var(--color-ink)",
    colorNeutral: "var(--color-ink)",
    colorBorder: "var(--color-muted)",
    // Errors stay ink, with Clerk's icon beside them, as in the app's own forms.
    colorDanger: "var(--color-ink)",
    colorRing: "var(--color-board)",
    fontFamilyButtons: "var(--font-b612-mono), ui-monospace, monospace",
    borderRadius: "var(--radius)",
  },
  elements: {
    formButtonPrimary: "uppercase tracking-wider",
    // The account button on the band: a 32px avatar in a 44px target.
    userButtonTrigger: "rounded-full p-1.5",
    avatarBox: "size-8",
  },
};
