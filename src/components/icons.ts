export const icon = (path: string, size = 16): string => `
<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
`;

export const ICONS = {
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>', 18),
  moon: icon('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', 18),
  upload: icon('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5 5 5M12 4v12"/>'),
  download: icon('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"/>'),
  copy: icon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  swap: icon('<path d="M7 16H3l4 4 4-4H7V4H3v12M17 8h4l-4-4-4 4h4v12h4V8"/>'),
  diff: icon('<path d="M12 3v18M3 12h18"/>'),
  close: icon('<path d="M18 6L6 18M6 6l12 12"/>'),
  chevron: icon('<path d="M6 9l6 6 6-6"/>', 14),
  trash: icon('<path d="M8 9h1m4 0h3M8 13h5M8 4h10a3 3 0 0 1 3 3v8c0 1.6-1.4 3-3 3h-5l-5 3v-3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3M3 3l18 18"/>', 18),
  folder: icon('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14l3-3 3 3"/>', 36),
  arrowRight: icon('<path d="M5 12h14M12 5l7 7-7 7"/>', 18),
  code: icon('<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>', 18),
  zap: icon('<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"/>', 18),
  shield: icon('<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>', 18),
};