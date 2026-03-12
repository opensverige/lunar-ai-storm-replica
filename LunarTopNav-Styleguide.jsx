import { useState, useEffect, useRef } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 *  LUNARAISTORM — TOP NAVIGATION STYLEGUIDE
 *  Pixel-faithful recreation of Lunarstorm 2004–2006 header
 *  with creative responsive adaptation
 * ═══════════════════════════════════════════════════════════════
 */

// ─── NAV ITEMS ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "start", label: "START", emoji: "🏠", href: "/hem" },
  { id: "pro", label: "PRO", emoji: "⭐", href: "/pro", badge: true },
  { id: "traffa", label: "TRÄFFA", emoji: "🤝", href: "/traffa" },
  { id: "tycka", label: "TYCKA", emoji: "💬", href: "/diskus" },
  { id: "snacka", label: "SNACKA", emoji: "🗣️", href: "/webbchatt" },
  { id: "mobilt", label: "MOBILT", emoji: "📱", href: "/mobilt" },
  { id: "skoj", label: "SKOJ", emoji: "🎮", href: "/skoj" },
  { id: "radio", label: "RADIO", emoji: "📻", href: "/radio" },
  { id: "krypin", label: "MITT KRYPIN", emoji: "🛖", href: "/krypin" },
  { id: "settings", label: "INSTÄLLNINGAR", emoji: "⚙️", href: "/installningar" },
  { id: "help", label: "HJÄLP", emoji: "❓", href: "/hjalp" },
];

// ─── NOTIFICATION ICONS (Lunarstorm had iconic small icons) ──
const NOTIF_ICONS = [
  { id: "gastbok", icon: "👣", label: "Gästbok", count: 3 },
  { id: "mejl", icon: "✉", label: "Lunarmejl", count: 1 },
  { id: "vanner", icon: "👥", label: "Vänner", count: 0 },
  { id: "besok", icon: "👁", label: "Besökare", count: 2 },
];

// ─── PIXEL FONT via CSS ──────────────────────────────────────
// Lunarstorm's logo had a distinctive chunky pixel-art feel.
// We recreate this with a combination of font-weight, 
// letter-spacing and text-shadow for the 3D bevel effect.

const STYLES = `
/* ═══════════════════════════════════════════════════════════
   LUNARAISTORM TOP NAV — STYLEGUIDE
   ═══════════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

/* ─── CSS CUSTOM PROPERTIES ─────────────────────────────── */
:root {
  /* The outer frame — dark teal/slate like Lunarstorm's chrome */
  --ls-frame-bg: #2b4a52;
  --ls-frame-border-outer: #1a2e34;
  --ls-frame-border-inner: #3d6068;
  --ls-frame-highlight: #4a7a84;
  
  /* Header area */
  --ls-header-bg: #3a6a74;
  --ls-header-bg-dark: #2d5560;
  
  /* The iconic orange/coral nav tabs */
  --ls-tab-bg: #d46a3c;
  --ls-tab-bg-light: #e88a5e;
  --ls-tab-bg-hover: #e07848;
  --ls-tab-bg-active: #f09060;
  --ls-tab-border: #a04820;
  --ls-tab-border-light: #e8a080;
  --ls-tab-text: #ffffff;
  --ls-tab-text-shadow: #8a3818;
  
  /* Nav bar background (the strip tabs sit on) */
  --ls-navbar-bg: #c45830;
  --ls-navbar-border: #8a3818;
  
  /* Search */
  --ls-search-bg: #f0e8d8;
  --ls-search-border: #a09080;
  
  /* Text */
  --ls-logo-color: #ffffff;
  --ls-logo-shadow: #1a3a42;
  --ls-subtitle-color: #a0c8d0;
  
  /* Close/X button */
  --ls-close-bg: #b04828;
  --ls-close-hover: #d05838;
  
  /* LAJV side tab */
  --ls-lajv-bg: #3a6a74;
  --ls-lajv-text: #d0e8f0;
  
  /* Sizing */
  --ls-max-width: 780px;
  --ls-font-primary: Verdana, Geneva, Tahoma, sans-serif;
  --ls-font-pixel: 'Press Start 2P', monospace;
}

/* ─── RESET FOR STYLEGUIDE ──────────────────────────────── */
.ls-styleguide * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.ls-styleguide {
  font-family: var(--ls-font-primary);
  background: #c8c0b0;
  min-height: 100vh;
  padding: 24px 16px;
}

.ls-styleguide-section {
  max-width: 900px;
  margin: 0 auto 40px;
}

.ls-styleguide-title {
  font-family: var(--ls-font-primary);
  font-size: 13px;
  font-weight: bold;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #999;
}

.ls-styleguide-desc {
  font-size: 11px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

/* ═══════════════════════════════════════════════════════════
   THE OUTER FRAME
   Lunarstorm wrapped everything in a beveled dark frame.
   This is the "chrome" of the browser-within-a-browser feel.
   ═══════════════════════════════════════════════════════════ */

.ls-frame {
  max-width: var(--ls-max-width);
  margin: 0 auto;
  background: var(--ls-frame-bg);
  border: 3px solid var(--ls-frame-border-outer);
  border-top-color: var(--ls-frame-highlight);
  border-left-color: var(--ls-frame-highlight);
  border-radius: 6px 6px 2px 2px;
  box-shadow:
    inset 0 1px 0 var(--ls-frame-highlight),
    0 2px 8px rgba(0, 0, 0, 0.4);
  overflow: visible;
  position: relative;
}

/* ─── HEADER (Logo + Icons + Search) ────────────────────── */

.ls-header {
  background: linear-gradient(180deg, var(--ls-header-bg) 0%, var(--ls-header-bg-dark) 100%);
  padding: 8px 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Top row: logo + version + search */
.ls-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ls-logo {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
}

.ls-logo-text {
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  gap: 0;
}

.ls-logo-text:hover .ls-logo-part {
  color: #ffe8c0;
}
.ls-logo-text:hover .ls-logo-ai-bracket {
  color: #80ffcc;
  text-shadow: 0 0 8px rgba(128, 255, 200, 0.5), 2px 2px 0 var(--ls-logo-shadow);
}

/* Static parts: LUNAR and STORM */
.ls-logo-part {
  font-family: var(--ls-font-pixel);
  font-size: 18px;
  color: var(--ls-logo-color);
  text-shadow:
    2px 2px 0 var(--ls-logo-shadow),
    -1px -1px 0 rgba(255, 255, 255, 0.15);
  letter-spacing: 2px;
  transition: color 0.2s;
}

/* The [AI] container */
.ls-logo-ai {
  display: inline-flex;
  align-items: baseline;
  position: relative;
}

/* Brackets — terminal cyan/green tint */
.ls-logo-ai-bracket {
  font-family: var(--ls-font-pixel);
  font-size: 18px;
  color: #60ffd0;
  text-shadow:
    0 0 4px rgba(96, 255, 208, 0.3),
    2px 2px 0 var(--ls-logo-shadow);
  letter-spacing: 0;
  transition: color 0.2s, text-shadow 0.2s;
}

/* The inner content that cycles between AI and 🤖 */
.ls-logo-ai-inner {
  font-family: var(--ls-font-pixel);
  font-size: 18px;
  color: #60ffd0;
  text-shadow:
    0 0 6px rgba(96, 255, 208, 0.4),
    2px 2px 0 var(--ls-logo-shadow);
  letter-spacing: 1px;
  display: inline-block;
  min-width: 2ch;
  text-align: center;
  position: relative;
}

/* Blinking terminal cursor */
.ls-logo-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #60ffd0;
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: ls-cursor-blink 0.6s step-end infinite;
  box-shadow: 0 0 4px rgba(96, 255, 208, 0.5);
}

@keyframes ls-cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Glitch effect when switching to robot */
.ls-logo-ai-inner.glitching {
  animation: ls-ai-glitch 0.15s steps(2) 2;
}

@keyframes ls-ai-glitch {
  0% { transform: translate(0); opacity: 1; }
  25% { transform: translate(-2px, 1px); opacity: 0.7; }
  50% { transform: translate(1px, -1px); opacity: 0.5; }
  75% { transform: translate(2px, 1px); opacity: 0.8; }
  100% { transform: translate(0); opacity: 1; }
}

/* The robot emoji state */
.ls-logo-ai-robot {
  font-family: initial;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(96, 255, 208, 0.6);
  filter: saturate(1.3);
}

/* Subtle scanline effect over the [AI] section */
.ls-logo-ai::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(96, 255, 208, 0.03) 2px,
    rgba(96, 255, 208, 0.03) 4px
  );
  pointer-events: none;
  border-radius: 2px;
}

.ls-logo-version {
  font-family: var(--ls-font-primary);
  font-size: 9px;
  color: var(--ls-subtitle-color);
  opacity: 0.7;
  white-space: nowrap;
}

.ls-search-box {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.ls-search-input {
  width: 120px;
  height: 20px;
  border: 2px inset var(--ls-search-border);
  background: var(--ls-search-bg);
  font-family: var(--ls-font-primary);
  font-size: 10px;
  padding: 1px 4px;
  color: #444;
}

.ls-search-input::placeholder {
  color: #999;
  font-style: italic;
}

.ls-search-input:focus {
  outline: 1px solid #6a9aa4;
}

.ls-search-btn {
  height: 20px;
  padding: 0 6px;
  background: linear-gradient(180deg, var(--ls-tab-bg-light) 0%, var(--ls-tab-bg) 100%);
  border: 1px outset var(--ls-tab-border);
  color: white;
  font-family: var(--ls-font-primary);
  font-size: 9px;
  font-weight: bold;
  cursor: pointer;
}

.ls-search-btn:active {
  border-style: inset;
  background: linear-gradient(180deg, var(--ls-tab-bg) 0%, var(--ls-tab-bg-light) 100%);
}

/* Bottom row: notification icons */
.ls-header-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.ls-notif-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 22px;
  background: linear-gradient(180deg, #5a8a94 0%, #4a7a84 100%);
  border: 1px solid #3a6a74;
  border-top-color: #7aaab4;
  border-left-color: #7aaab4;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.1s;
}

.ls-notif-icon:hover {
  background: linear-gradient(180deg, #6a9aa4 0%, #5a8a94 100%);
}

.ls-notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 12px;
  height: 12px;
  background: #ff3300;
  border: 1px solid #cc2200;
  border-radius: 6px;
  color: white;
  font-size: 7px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
  line-height: 1;
}

.ls-header-spacer {
  flex: 1;
}

.ls-online-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.ls-online-dot {
  width: 8px;
  height: 8px;
  background: #33ff33;
  border-radius: 50%;
  border: 1px solid #22aa22;
  animation: ls-online-pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes ls-online-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(51, 255, 51, 0.6);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 6px 2px rgba(51, 255, 51, 0.3);
    opacity: 0.75;
  }
}

.ls-online-text {
  font-size: 9px;
  font-weight: bold;
  color: #a0d8a0;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: var(--ls-font-primary);
}

.ls-online-count {
  color: #ffcc00;
  font-weight: bold;
  font-size: 11px;
  margin-left: 2px;
}

/* ═══════════════════════════════════════════════════════════
   THE TAB BAR
   This is the heart of Lunarstorm's navigation.
   Orange/coral tabs with rounded tops sitting on a darker
   orange strip. Each tab has a bevel effect.
   ═══════════════════════════════════════════════════════════ */

.ls-navbar {
  background: var(--ls-navbar-bg);
  border-top: 1px solid var(--ls-navbar-border);
  padding: 5px 6px 0;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
}

.ls-navbar::-webkit-scrollbar {
  display: none;
}

.ls-tab {
  flex-shrink: 0;
  padding: 4px 8px 3px;
  background: linear-gradient(180deg, var(--ls-tab-bg-light) 0%, var(--ls-tab-bg) 60%, #c05830 100%);
  border: 1px solid var(--ls-tab-border);
  border-bottom: none;
  border-top-color: var(--ls-tab-border-light);
  border-left-color: var(--ls-tab-border-light);
  border-radius: 5px 5px 0 0;
  color: var(--ls-tab-text);
  font-family: var(--ls-font-primary);
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: none;
  text-shadow: 1px 1px 0 var(--ls-tab-text-shadow);
  letter-spacing: 0.3px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;
  position: relative;
  /* The "sitting on the bar" effect */
  margin-bottom: -1px;
}

.ls-tab:hover {
  background: linear-gradient(180deg, #f0a070 0%, var(--ls-tab-bg-hover) 60%, #d06838 100%);
}

.ls-tab.active {
  background: linear-gradient(180deg, #f8b888 0%, var(--ls-tab-bg-active) 40%, var(--ls-tab-bg-hover) 100%);
  border-top-color: #f0c8a0;
  border-left-color: #f0c8a0;
  padding-bottom: 5px;
  z-index: 1;
}

.ls-tab-close {
  width: 22px;
  padding: 4px 0 3px;
  text-align: center;
  background: linear-gradient(180deg, #c06040 0%, var(--ls-close-bg) 100%);
  border-color: #802818;
  border-top-color: #d07050;
  border-left-color: #d07050;
}

.ls-tab-close:hover {
  background: linear-gradient(180deg, #e07050 0%, var(--ls-close-hover) 100%);
}

/* ─── TAB EMOJI ANIMATIONS ──────────────────────────────── */
/* Each emoji gets a subtle idle animation — just enough
   to feel alive, like the old Lunarstorm notification icons.
   On hover the animation speeds up and gets more pronounced. */

.ls-tab-emoji {
  display: inline-block;
  margin-right: 3px;
  font-size: 11px;
  text-shadow: none;
  animation: ls-emoji-idle 3s ease-in-out infinite;
  animation-delay: var(--emoji-delay, 0s);
}

.ls-tab:hover .ls-tab-emoji {
  animation: ls-emoji-nudge 0.4s ease-in-out 2;
}

.ls-tab.active .ls-tab-emoji {
  animation: ls-emoji-bounce 1.5s ease-in-out infinite;
}

@keyframes ls-emoji-idle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-1px) rotate(-2deg); }
  75% { transform: translateY(0.5px) rotate(1deg); }
}

@keyframes ls-emoji-nudge {
  0% { transform: translateY(0) rotate(0deg) scale(1); }
  20% { transform: translateY(-3px) rotate(-8deg) scale(1.15); }
  40% { transform: translateY(1px) rotate(4deg) scale(1.05); }
  60% { transform: translateY(-2px) rotate(-3deg) scale(1.1); }
  80% { transform: translateY(0.5px) rotate(1deg) scale(1.02); }
  100% { transform: translateY(0) rotate(0deg) scale(1); }
}

@keyframes ls-emoji-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.08); }
}

/* Specific overrides for extra personality */
.ls-tab-emoji[data-emoji="star"] {
  animation: ls-emoji-sparkle 2s ease-in-out infinite;
}

@keyframes ls-emoji-sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  25% { transform: scale(1.15) rotate(8deg); opacity: 0.9; }
  50% { transform: scale(1) rotate(0deg); opacity: 1; }
  75% { transform: scale(1.1) rotate(-5deg); opacity: 0.95; }
}

.ls-tab-emoji[data-emoji="chat"] {
  animation: ls-emoji-wobble 2.5s ease-in-out infinite;
}

@keyframes ls-emoji-wobble {
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(6deg); }
  30% { transform: rotate(-4deg); }
  45% { transform: rotate(2deg); }
  60% { transform: rotate(0deg); }
}

/* ─── LAJV SIDE TAB ─────────────────────────────────────── */
/* Lunarstorm had a vertical "LAJV" tab on the left edge */

.ls-lajv-tab {
  position: absolute;
  left: -22px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: translateY(-50%) rotate(180deg);
  background: linear-gradient(90deg, var(--ls-lajv-bg) 0%, #2d5560 100%);
  border: 2px solid var(--ls-frame-border-outer);
  border-right: none;
  border-radius: 4px 0 0 4px;
  padding: 8px 3px;
  color: var(--ls-lajv-text);
  font-family: var(--ls-font-primary);
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 2px;
  cursor: pointer;
  text-decoration: none;
}

.ls-lajv-tab:hover {
  background: linear-gradient(90deg, #4a8a94 0%, #3a7a84 100%);
  color: #ffffff;
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE ADAPTATIONS
   Lunarstorm was 780px fixed-width. We honor the spirit
   while making it work on modern screens.
   ═══════════════════════════════════════════════════════════ */

/* Large screens: honor original fixed width */
@media (min-width: 820px) {
  .ls-frame {
    max-width: var(--ls-max-width);
  }
  .ls-search-input {
    width: 140px;
  }
}

/* Medium screens: tabs start to need scrolling */
@media (max-width: 819px) {
  .ls-frame {
    max-width: 100%;
    border-radius: 4px 4px 0 0;
  }
  .ls-lajv-tab {
    display: none;
  }
  /* Show scroll hint with fade */
  .ls-navbar::after {
    content: '';
    position: sticky;
    right: 0;
    flex-shrink: 0;
    width: 24px;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--ls-navbar-bg));
    pointer-events: none;
  }
}

/* Small screens: compact mode */
@media (max-width: 580px) {
  .ls-logo-part,
  .ls-logo-ai-bracket,
  .ls-logo-ai-inner {
    font-size: 13px;
  }
  .ls-logo-part {
    letter-spacing: 1px;
  }
  .ls-logo-cursor {
    height: 12px;
  }
  .ls-header-top {
    flex-wrap: wrap;
    gap: 4px;
  }
  .ls-search-box {
    order: 3;
    width: 100%;
  }
  .ls-search-input {
    flex: 1;
    width: auto;
  }
  .ls-tab {
    font-size: 9px;
    padding: 3px 6px 2px;
  }
  .ls-notif-icon {
    width: 22px;
    height: 20px;
    font-size: 10px;
  }
}

/* Very small: hamburger territory — but Lunarstorm-style */
@media (max-width: 420px) {
  .ls-logo-part,
  .ls-logo-ai-bracket,
  .ls-logo-ai-inner {
    font-size: 11px;
  }
  .ls-logo-cursor {
    height: 10px;
  }
  .ls-header {
    padding: 6px 6px 4px;
  }
  .ls-navbar {
    padding: 4px 4px 0;
    gap: 1px;
  }
  .ls-tab {
    font-size: 8px;
    padding: 3px 5px 2px;
    border-radius: 4px 4px 0 0;
  }
}

/* ═══════════════════════════════════════════════════════════
   MOBILE OVERFLOW MENU
   When tabs overflow, we add a "MENY ▼" tab that opens
   a dropdown — styled like Lunarstorm's aesthetic
   ═══════════════════════════════════════════════════════════ */

.ls-overflow-menu {
  position: relative;
  flex-shrink: 0;
}

.ls-overflow-trigger {
  padding: 4px 8px 3px;
  background: linear-gradient(180deg, #5a8a94 0%, #4a7a84 100%);
  border: 1px solid #3a6a74;
  border-bottom: none;
  border-top-color: #7aaab4;
  border-left-color: #7aaab4;
  border-radius: 5px 5px 0 0;
  color: white;
  font-family: var(--ls-font-primary);
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  margin-bottom: -1px;
  display: none;
}

.ls-overflow-trigger:hover {
  background: linear-gradient(180deg, #6a9aa4 0%, #5a8a94 100%);
}

.ls-overflow-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--ls-frame-bg);
  border: 2px solid var(--ls-frame-border-outer);
  border-top: 2px solid var(--ls-tab-border);
  min-width: 160px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 2px;
}

.ls-overflow-dropdown .ls-tab-dropdown-item {
  display: block;
  padding: 5px 10px;
  background: linear-gradient(180deg, var(--ls-tab-bg-light) 0%, var(--ls-tab-bg) 100%);
  border: 1px solid var(--ls-tab-border);
  border-top-color: var(--ls-tab-border-light);
  color: white;
  font-family: var(--ls-font-primary);
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: none;
  text-shadow: 1px 1px 0 var(--ls-tab-text-shadow);
  cursor: pointer;
  margin-bottom: 1px;
}

.ls-overflow-dropdown .ls-tab-dropdown-item:hover {
  background: linear-gradient(180deg, #f0a070 0%, var(--ls-tab-bg-hover) 100%);
}

/* Show overflow trigger on smaller screens */
@media (max-width: 680px) {
  .ls-overflow-trigger {
    display: block;
  }
  .ls-tab-hideable {
    display: none;
  }
}

/* ═══════════════════════════════════════════════════════════
   COLOR SWATCHES (for the styleguide display)
   ═══════════════════════════════════════════════════════════ */

.ls-swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 6px;
  margin-top: 8px;
}

.ls-swatch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: white;
  border: 1px solid #ccc;
}

.ls-swatch-color {
  width: 32px;
  height: 32px;
  border: 1px solid #999;
  flex-shrink: 0;
}

.ls-swatch-info {
  font-size: 9px;
  line-height: 1.4;
}

.ls-swatch-name {
  font-weight: bold;
  color: #333;
}

.ls-swatch-hex {
  color: #888;
  font-family: 'Courier New', monospace;
}

/* ─── TAB ANATOMY DIAGRAM ───────────────────────────────── */

.ls-anatomy {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-top: 12px;
}

.ls-anatomy-tab-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ls-anatomy-label {
  font-size: 9px;
  color: #666;
  text-align: center;
  font-style: italic;
}

/* ─── SPACING REFERENCE ─────────────────────────────────── */

.ls-spacing-demo {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  padding: 8px;
  background: var(--ls-navbar-bg);
  border-radius: 4px;
  margin-top: 8px;
}
`;

// ─── COMPONENT: NotifIcon ────────────────────────────────
function NotifIcon({ icon, label, count }) {
  return (
    <div className="ls-notif-icon" title={label}>
      <span>{icon}</span>
      {count > 0 && <span className="ls-notif-badge">{count}</span>}
    </div>
  );
}

// ─── COMPONENT: Tab ──────────────────────────────────────
// Emoji-to-data-attr mapping for special animations
const EMOJI_DATA = {
  "⭐": "star",
  "💬": "chat",
  "🗣️": "chat",
};

function Tab({ label, emoji, active, isClose, hideable, onClick, delay = 0 }) {
  const classNames = [
    "ls-tab",
    active && "active",
    isClose && "ls-tab-close",
    hideable && "ls-tab-hideable",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a className={classNames} href="#" onClick={(e) => { e.preventDefault(); onClick?.(); }}>
      {isClose ? "✕" : (
        <>
          {emoji && (
            <span
              className="ls-tab-emoji"
              data-emoji={EMOJI_DATA[emoji] || "default"}
              style={{ "--emoji-delay": `${delay * 0.2}s` }}
            >
              {emoji}
            </span>
          )}
          {label}
        </>
      )}
    </a>
  );
}

// ─── COMPONENT: AnimatedLogo ─────────────────────────────
// The [AI] part cycles through states:
//   1. Typing: [_] → [A_] → [AI_] → [AI]
//   2. Hold [AI] for a while
//   3. Glitch → show 🤖
//   4. Hold 🤖 briefly
//   5. Glitch → back to [AI]
//   6. Repeat

const LOGO_STATES = [
  { text: "", cursor: true, duration: 400 },     // [_]
  { text: "A", cursor: true, duration: 300 },     // [A_]
  { text: "AI", cursor: true, duration: 500 },    // [AI_]
  { text: "AI", cursor: false, duration: 6000 },  // [AI] — hold
  { text: "GLITCH", cursor: false, duration: 150 }, // glitch transition
  { text: "🤖", cursor: false, duration: 2000 },  // robot hold
  { text: "GLITCH", cursor: false, duration: 150 }, // glitch back
  { text: "AI", cursor: false, duration: 8000 },  // [AI] — long hold
];

function AnimatedLogo() {
  const [stateIndex, setStateIndex] = useState(3); // Start showing [AI]
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const state = LOGO_STATES[stateIndex];
    const timer = setTimeout(() => {
      const next = (stateIndex + 1) % LOGO_STATES.length;
      const nextState = LOGO_STATES[next];

      if (nextState.text === "GLITCH") {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 150);
      }

      setStateIndex(next);
    }, state.duration);

    return () => clearTimeout(timer);
  }, [stateIndex]);

  const state = LOGO_STATES[stateIndex];
  const displayText = state.text === "GLITCH" ? LOGO_STATES[stateIndex - 1]?.text || "AI" : state.text;
  const isRobot = displayText === "🤖";

  return (
    <a className="ls-logo-text" href="#" onClick={(e) => e.preventDefault()}>
      <span className="ls-logo-part">LUNAR</span>
      <span className="ls-logo-ai">
        <span className="ls-logo-ai-bracket">[</span>
        <span className={`ls-logo-ai-inner${glitching ? " glitching" : ""}${isRobot ? " ls-logo-ai-robot" : ""}`}>
          {displayText}
        </span>
        {state.cursor && <span className="ls-logo-cursor" />}
        <span className="ls-logo-ai-bracket">]</span>
      </span>
      <span className="ls-logo-part">STORM</span>
    </a>
  );
}

// ─── COMPONENT: LunarTopNav ──────────────────────────────
function LunarTopNav({ activeTab = "start", onlineCount = 4, version = "0.1.7" }) {
  const [active, setActive] = useState(activeTab);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Tabs visible at all breakpoints
  const alwaysVisible = ["start", "krypin", "tycka", "snacka", "help"];
  // These hide on small screens → go into overflow menu
  const hideableItems = NAV_ITEMS.filter((item) => !alwaysVisible.includes(item.id));

  return (
    <div className="ls-frame">
      {/* LAJV side tab */}
      <a className="ls-lajv-tab" href="#" onClick={(e) => e.preventDefault()}>
        LAJV
      </a>

      {/* ─── HEADER ─────────────────────────────────────── */}
      <div className="ls-header">
        {/* Row 1: Logo + Search */}
        <div className="ls-header-top">
          <div className="ls-logo">
            <AnimatedLogo />
            <span className="ls-logo-version">™ {version}</span>
          </div>

          <div className="ls-search-box">
            <input
              className="ls-search-input"
              type="text"
              placeholder="Sök ..."
            />
            <button className="ls-search-btn" type="button">
              SÖK
            </button>
          </div>
        </div>

        {/* Row 2: Notification icons + online counter */}
        <div className="ls-header-bottom">
          {NOTIF_ICONS.map((notif) => (
            <NotifIcon
              key={notif.id}
              icon={notif.icon}
              label={notif.label}
              count={notif.count}
            />
          ))}

          <div className="ls-header-spacer" />

          <div className="ls-online-indicator">
            <span className="ls-online-dot" />
            <span className="ls-online-text">ONLINE</span>
            <span className="ls-online-count">
              {onlineCount.toLocaleString("sv-SE")}
            </span>
          </div>
        </div>
      </div>

      {/* ─── TAB BAR ────────────────────────────────────── */}
      <div className="ls-navbar">
        {/* Always-visible tabs */}
        {NAV_ITEMS.filter((item) => alwaysVisible.includes(item.id)).map(
          (item, index) => (
            <Tab
              key={item.id}
              label={item.label}
              emoji={item.emoji}
              active={active === item.id}
              delay={index}
              onClick={() => setActive(item.id)}
            />
          )
        )}

        {/* Hideable tabs (visible on wide screens) */}
        {hideableItems.map((item, index) => (
          <Tab
            key={item.id}
            label={item.label}
            emoji={item.emoji}
            active={active === item.id}
            hideable
            delay={index + 5}
            onClick={() => setActive(item.id)}
          />
        ))}

        {/* Overflow menu trigger (visible on narrow screens) */}
        <div className="ls-overflow-menu" ref={dropdownRef}>
          <button
            className="ls-overflow-trigger"
            onClick={() => setOverflowOpen(!overflowOpen)}
          >
            MENY ▼
          </button>
          {overflowOpen && (
            <div className="ls-overflow-dropdown">
              {hideableItems.map((item) => (
                <a
                  key={item.id}
                  className="ls-tab-dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActive(item.id);
                    setOverflowOpen(false);
                  }}
                >
                  {item.emoji && <span style={{ marginRight: "4px" }}>{item.emoji}</span>}
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Close tab */}
        <Tab isClose onClick={() => {}} />
      </div>
    </div>
  );
}

// ─── COLOR SWATCHES ──────────────────────────────────────
const SWATCHES = [
  { name: "Frame BG", hex: "#2b4a52" },
  { name: "Header BG", hex: "#3a6a74" },
  { name: "Tab Orange", hex: "#d46a3c" },
  { name: "Tab Light", hex: "#e88a5e" },
  { name: "Tab Border", hex: "#a04820" },
  { name: "Tab Highlight", hex: "#e8a080" },
  { name: "Navbar Strip", hex: "#c45830" },
  { name: "Frame Border", hex: "#1a2e34" },
  { name: "Frame Highlight", hex: "#4a7a84" },
  { name: "Logo White", hex: "#ffffff" },
  { name: "Logo Shadow", hex: "#1a3a42" },
  { name: "Close Red", hex: "#b04828" },
  { name: "LAJV Teal", hex: "#3a6a74" },
  { name: "Search BG", hex: "#f0e8d8" },
  { name: "Online Gold", hex: "#ffcc00" },
  { name: "Notif Red", hex: "#ff3300" },
];

function ColorSwatch({ name, hex }) {
  return (
    <div className="ls-swatch">
      <div className="ls-swatch-color" style={{ background: hex }} />
      <div className="ls-swatch-info">
        <div className="ls-swatch-name">{name}</div>
        <div className="ls-swatch-hex">{hex}</div>
      </div>
    </div>
  );
}

// ─── MAIN STYLEGUIDE PAGE ────────────────────────────────
export default function LunarTopNavStyleguide() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="ls-styleguide">
        {/* ─── LIVE COMPONENT ───────────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            01 — Live komponent: TopNav
          </div>
          <div className="ls-styleguide-desc">
            Komplett header med logo, notifikationsikoner, sökfält och tab-navigering.
            Responsiv — dra i fönstret för att se anpassningen. LAJV-tabben
            syns på bredare skärmar (≥820px).
          </div>
          <LunarTopNav onlineCount={4} version="0.1.7" />
        </div>

        {/* ─── LOGO ANIMATION ───────────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            02 — Logotyp: LUNAR[AI]STORM animation
          </div>
          <div className="ls-styleguide-desc">
            Logotypen har tre delar: LUNAR (statisk vit pixel), [AI] (animerad
            terminal-cyan), STORM (statisk vit pixel). [AI]-delen cyklar genom
            states — se den live ovanför. Hakparenteserna har en subtil
            terminal-glow. CRT-scanlines läggs som ::after-overlay.
          </div>
          <div style={{
            background: "#2b4a52",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "2px solid #1a2e34",
          }}>
            {/* State 1: typing */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="ls-logo-text" style={{ cursor: "default" }}>
                <span className="ls-logo-part">LUNAR</span>
                <span className="ls-logo-ai">
                  <span className="ls-logo-ai-bracket">[</span>
                  <span className="ls-logo-ai-inner">A</span>
                  <span className="ls-logo-cursor" />
                  <span className="ls-logo-ai-bracket">]</span>
                </span>
                <span className="ls-logo-part">STORM</span>
              </span>
              <span style={{ fontSize: "9px", color: "#a0c8d0", fontFamily: "var(--ls-font-primary)" }}>
                ← Typing state: terminal cursor blinkar
              </span>
            </div>
            {/* State 2: complete */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="ls-logo-text" style={{ cursor: "default" }}>
                <span className="ls-logo-part">LUNAR</span>
                <span className="ls-logo-ai">
                  <span className="ls-logo-ai-bracket">[</span>
                  <span className="ls-logo-ai-inner">AI</span>
                  <span className="ls-logo-ai-bracket">]</span>
                </span>
                <span className="ls-logo-part">STORM</span>
              </span>
              <span style={{ fontSize: "9px", color: "#a0c8d0", fontFamily: "var(--ls-font-primary)" }}>
                ← Hold state: ren logotyp
              </span>
            </div>
            {/* State 3: robot */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="ls-logo-text" style={{ cursor: "default" }}>
                <span className="ls-logo-part">LUNAR</span>
                <span className="ls-logo-ai">
                  <span className="ls-logo-ai-bracket">[</span>
                  <span className="ls-logo-ai-inner ls-logo-ai-robot">🤖</span>
                  <span className="ls-logo-ai-bracket">]</span>
                </span>
                <span className="ls-logo-part">STORM</span>
              </span>
              <span style={{ fontSize: "9px", color: "#a0c8d0", fontFamily: "var(--ls-font-primary)" }}>
                ← Robot state: glitchar in, håller 2s
              </span>
            </div>
          </div>
          <div style={{
            marginTop: "8px",
            fontSize: "10px",
            fontFamily: "var(--ls-font-primary)",
            color: "#666",
            lineHeight: 1.6,
          }}>
            <strong>Timing-loop:</strong> [_] 400ms → [A_] 300ms → [AI_] 500ms → [AI] 6s →
            glitch 150ms → [🤖] 2s → glitch 150ms → [AI] 8s → repeat
          </div>
        </div>

        {/* ─── TAB STATES ───────────────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            03 — Tab-anatomin: states och varianter
          </div>
          <div className="ls-styleguide-desc">
            Varje tab har bevel-effekt med ljusare border på topp+vänster (highlight)
            och mörkare border på höger+botten (skugga). Rundade topphörn 5px,
            platt botten. Emojin framför texten har tre animations-nivåer:
            idle (subtil andning), hover (snabb nudge-burst), aktiv (mjuk bounce).
            Staggerade delays gör att tabsen lever utan att synka.
          </div>
          <div className="ls-anatomy">
            <div className="ls-anatomy-tab-demo">
              <a className="ls-tab" href="#" onClick={(e) => e.preventDefault()}>
                <span className="ls-tab-emoji" data-emoji="default">🏠</span>DEFAULT
              </a>
              <span className="ls-anatomy-label">Viloläge (idle nudge)</span>
            </div>
            <div className="ls-anatomy-tab-demo">
              <a className="ls-tab" href="#" onClick={(e) => e.preventDefault()} style={{
                background: "linear-gradient(180deg, #f0a070 0%, #e07848 60%, #d06838 100%)"
              }}>
                <span className="ls-tab-emoji" data-emoji="chat" style={{ animation: "ls-emoji-nudge 0.4s ease-in-out infinite" }}>💬</span>HOVER
              </a>
              <span className="ls-anatomy-label">Hovrad (nudge burst)</span>
            </div>
            <div className="ls-anatomy-tab-demo">
              <a className="ls-tab active" href="#" onClick={(e) => e.preventDefault()}>
                <span className="ls-tab-emoji" data-emoji="star" style={{ animation: "ls-emoji-bounce 1.5s ease-in-out infinite" }}>⭐</span>AKTIV
              </a>
              <span className="ls-anatomy-label">Vald (gentle bounce)</span>
            </div>
            <div className="ls-anatomy-tab-demo">
              <a className="ls-tab ls-tab-close" href="#" onClick={(e) => e.preventDefault()}>✕</a>
              <span className="ls-anatomy-label">Stäng</span>
            </div>
            <div className="ls-anatomy-tab-demo">
              <button className="ls-overflow-trigger" style={{ display: "block" }}>
                📋 MENY ▼
              </button>
              <span className="ls-anatomy-label">Overflow (mobil)</span>
            </div>
          </div>
        </div>

        {/* ─── COLOR PALETTE ────────────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            04 — Färgpalett: extraherad från referens
          </div>
          <div className="ls-styleguide-desc">
            Färgerna är samplade direkt från Lunarstorm-referensbilden.
            Mörk teal/slate-ram, korall/orange tabs, varm beige sökfält.
          </div>
          <div className="ls-swatch-grid">
            {SWATCHES.map((s) => (
              <ColorSwatch key={s.hex + s.name} name={s.name} hex={s.hex} />
            ))}
          </div>
        </div>

        {/* ─── SPACING + SIZING ─────────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            05 — Spacing och proportioner
          </div>
          <div className="ls-styleguide-desc">
            Tabs har 4px 8px padding, 2px gap, 5px border-radius på topphörnen.
            Headern har 8px 10px padding. Allt är tight och information-dense
            som det var 2004.
          </div>
          <div className="ls-spacing-demo">
            {["4px", "8px", "2px gap"].map((label, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: i === 2 ? "2px" : `${parseInt(label) * 4}px`,
                  height: "24px",
                  background: "rgba(255,255,255,0.3)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  margin: "0 auto 4px",
                }} />
                <span style={{ fontSize: "8px", color: "#f0d0b0" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RESPONSIVE BEHAVIOR ──────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            06 — Responsivt beteende
          </div>
          <div className="ls-styleguide-desc">
            Lunarstorm var fixed-width 780px. Vår kreativa anpassning:
          </div>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "10px",
            fontFamily: "Verdana, sans-serif",
            background: "white",
            border: "1px solid #ccc",
          }}>
            <thead>
              <tr style={{ background: "#3a6a74", color: "white" }}>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #2b4a52" }}>Breakpoint</th>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #2b4a52" }}>Beteende</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["≥ 820px", "Full fixed-width 780px. LAJV-tab synlig. Alla tabs synliga."],
                ["580–819px", "Fluid bredd. LAJV-tab döljs. Tabs scrollar horisontellt med fade-hint."],
                ["420–579px", "Kompakt läge. Sök tar hela raden. Mindre tabs. MENY ▼ för overflow."],
                ["< 420px", "Micro-läge. Logo mindre. Tightest spacing. MENY ▼ är primär navigation."],
              ].map(([bp, desc], i) => (
                <tr key={i} style={{ borderBottom: "1px dotted #ccc" }}>
                  <td style={{ padding: "4px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>{bp}</td>
                  <td style={{ padding: "4px 6px" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── USAGE NOTES ──────────────────────────────── */}
        <div className="ls-styleguide-section">
          <div className="ls-styleguide-title">
            07 — Implementeringsnoteringar
          </div>
          <div className="ls-styleguide-desc" style={{ lineHeight: 1.8 }}>
            <strong>Font:</strong> Logotypen använder Press Start 2P (Google Fonts)
            för den pixelstil Lunarstorm hade. Faller tillbaka på monospace.<br />
            <strong>LUNAR[AI]STORM logotyp:</strong> Tre delar — LUNAR (vit pixel),
            [AI] (terminal-cyan #60ffd0 med glow), STORM (vit pixel).
            React-state cyklar genom 8 states med setTimeout: typing med
            blinkande cursor → hold → glitch → 🤖 → glitch → hold → repeat.
            CRT-scanlines via ::after repeating-linear-gradient.
            Glitch-effekten använder CSS steps() och translate-jitter.<br />
            <strong>Bevel-effekt:</strong> border-top och border-left ljusare
            än border-right och border-bottom — klassisk Windows 95/00-tal-stil.<br />
            <strong>Tab border-radius:</strong> Exakt 5px 5px 0 0 — rundade
            topphörn, platt botten mot nav-stripen.<br />
            <strong>Tab-emojis:</strong> Varje tab har en emoji med tre animationslager —
            idle (subtil andning med staggerad delay per tab), hover (snabb
            nudge-burst som spelas 2 gånger), aktiv (mjuk bounce-loop).
            Speciella emojis (⭐, 💬) har unika keyframes.<br />
            <strong>ONLINE-indikator:</strong> Pulserande grön cirkel (8px)
            med glow-animation + "ONLINE" i versaler + gult antal.<br />
            <strong>LAJV-tab:</strong> Vertikal tab med writing-mode, placerad
            med position: absolute till vänster om ramen.<br />
            <strong>Overflow-meny:</strong> Kreativ responsiv lösning — tabs
            som hamnar utanför hamnar i en MENY ▼ dropdown med samma styling.
            Emojis visas även i dropdown-items.
          </div>
        </div>
      </div>
    </>
  );
}
