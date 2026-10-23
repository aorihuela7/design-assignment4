// Checks WCAG contrast for every text/background and UI pair the app uses.
// Reads the colors from src/app/globals.css so the check can't drift from the tokens.
// Usage: npm run check:contrast

import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const colors = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]),
);

// Tints used in the app, as blends of two tokens: [name, top color, opacity, bottom color].
const blends = [["stub", "canvas", 0.6, "surface"]]; // boarding pass stub: bg-canvas/60 on a card
for (const [name, top, alpha, bottom] of blends) {
  const mix = [1, 3, 5].map((i) => {
    const a = parseInt(colors[top].slice(i, i + 2), 16);
    const b = parseInt(colors[bottom].slice(i, i + 2), 16);
    return Math.round(a * alpha + b * (1 - alpha)).toString(16).padStart(2, "0");
  });
  colors[name] = `#${mix.join("")}`;
}

const TEXT = 4.5; // normal text
const LARGE = 3; // text at least 24px, or 18.66px bold
const UI = 3; // borders, focus rings and icons needed to understand a control (WCAG 1.4.11)
const INFO = null; // decorative or disabled: reported, not required

// [kind, foreground, background, minimum, where it's used]
const pairs = [
  ["Text", "ink", "canvas", TEXT, "Body text, section headings, BackLink, No lists yet"],
  ["Text", "ink", "surface", TEXT, "Cards, item names, labels, field text, error text, links, NEW badge"],
  ["Text", "ink", "line", TEXT, "Secondary and quiet buttons, pressed"],
  ["Text", "muted", "canvas", TEXT, "Intro line, Saved on this device, loading text, BackLink pressed, Remove on a hovered row"],
  ["Text", "muted", "surface", TEXT, "Code label, Last packed, placeholder, packed (struck) items, Remove"],
  ["Text", "ink", "stub", TEXT, "Boarding pass stub: count, Open"],
  ["Text", "muted", "stub", TEXT, "Boarding pass stub: Last packed"],
  ["Text", "amber", "board", TEXT, "Header: PACK AGAIN, Sign in and Sign up links"],
  ["Text", "board", "amber", TEXT, "Header links, pressed"],
  ["Text", "white", "accent", TEXT, "Primary button"],
  ["Text", "white", "accent-hover", TEXT, "Primary button, hover"],
  ["Text", "white", "accent-pressed", TEXT, "Primary button, pressed"],
  ["Text", "white", "ink", TEXT, "Delete trip (confirm) button"],
  ["Text", "white", "muted", TEXT, "Delete trip (confirm) button, hover"],
  ["Text", "white", "board", TEXT, "Delete trip (confirm) button, pressed"],
  ["Large", "amber", "board", LARGE, "Header h1 (page name)"],
  ["Large", "ink", "surface", LARGE, "List names on cards, form headings"],
  ["UI", "board", "canvas", UI, "Focus ring on the page"],
  ["UI", "board", "surface", UI, "Focus ring on cards and fields"],
  ["UI", "amber", "board", UI, "Focus ring on the Departures band"],
  ["UI", "muted", "surface", UI, "Text field and select border"],
  ["UI", "ink", "surface", UI, "Invalid field border, checkbox border, secondary button border, error, notice and warning icons"],
  ["UI", "ink", "canvas", UI, "Checkbox border on a hovered row, quiet button hover border"],
  ["UI", "surface", "ink", UI, "Checkmark and ! inside filled icons"],
  ["Disabled", "muted", "canvas", INFO, "Disabled button and field text (exempt, still passes)"],
  ["Disabled", "line", "canvas", INFO, "Disabled button and field border (exempt)"],
  ["Decor", "line", "surface", INFO, "Card border, tear line, row dividers"],
  ["Decor", "line", "canvas", INFO, "Notch outline"],
  ["Decor", "muted", "surface", INFO, "Runway dashes (the text count carries progress)"],
  ["Decor", "ink", "surface", INFO, "Plane icon (aria-hidden)"],
];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failed = false;
console.log("| Result | Ratio | Needs | Kind | Pair | Used for |");
console.log("|---|---|---|---|---|---|");
for (const [kind, fg, bg, min, where] of pairs) {
  if (!colors[fg] || !colors[bg]) throw new Error(`Missing token: ${colors[fg] ? bg : fg}`);
  const r = ratio(colors[fg], colors[bg]);
  const status = min === INFO ? "info" : r >= min ? "pass" : "FAIL";
  if (status === "FAIL") failed = true;
  const need = min === INFO ? "–" : `${min}:1`;
  console.log(`| ${status} | ${r.toFixed(2)}:1 | ${need} | ${kind} | ${fg} on ${bg} | ${where} |`);
}

process.exit(failed ? 1 : 0);
