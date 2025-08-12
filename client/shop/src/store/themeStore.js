import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// (Keep your helper functions hexToRgb and pSBC here)
function hexToRgb(hex) {
  if (!hex || hex.length < 4) return null;
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  return null;
}
const pSBC = (p, c) => { let i = parseInt, r = Math.round; let [h, m] = c.split("#"); if (h.length > 9) { let [R, G, B, A] = h.split(","), P = p < 0, t = P ? 1 + p : p; P = P ? 1 - t : 1 + t; return "rgba(" + r(R * P) + "," + r(G * P) + "," + r(B * P) + "," + (A ? A * t : t) + ")" } else { let f = i(m, 16), t = p < 0, a = t ? f : 0, b = t ? 0 : f; return "#" + (0x1000000 + (r(((a & 0xFF0000) >> 16) * t) + b) * 0x10000 + (r(((a & 0x00FF00) >> 8) * t) + b) * 0x100 + (r((a & 0x0000FF) * t) + b)).toString(16).slice(1) } };

export const useThemeStore = defineStore('theme', () => {
  const settings = ref({
    primaryColor: null,
    secondaryColor: null,
    siteBackgroundColor: null,
    siteTextColor: null,
    cardBackgroundColor: null
  });

  function setTheme(payload) {
    if (!payload) return;
    settings.value.primaryColor = payload.primaryColor || null;
    settings.value.secondaryColor = payload.secondaryColor || null;
    settings.value.siteBackgroundColor = payload.siteBackgroundColor || null;
    settings.value.siteTextColor = payload.siteTextColor || null;
    settings.value.cardBackgroundColor = payload.cardBackgroundColor || null;
  }

  const dynamicThemeCss = computed(() => {
    let css = '';
    const { primaryColor, secondaryColor, siteBackgroundColor, siteTextColor, cardBackgroundColor } = settings.value;

    // --- Generate global :root variables ---
    let rootVars = '';
    if (siteBackgroundColor) rootVars += `--bs-body-bg: ${siteBackgroundColor};`;
    if (siteTextColor) rootVars += `--bs-body-color: ${siteTextColor};`;
    if (cardBackgroundColor) rootVars += `--bs-card-bg: ${cardBackgroundColor};`;
    if (primaryColor) rootVars += `--bs-primary: ${primaryColor}; --bs-primary-rgb: ${hexToRgb(primaryColor)};`;
    if (secondaryColor) rootVars += `--bs-secondary: ${secondaryColor}; --bs-secondary-rgb: ${hexToRgb(secondaryColor)};`;

    if (rootVars) {
      css += `:root { ${rootVars} }`;
    }

    // --- Generate component-specific overrides ---

    // Primary Button
    if (primaryColor) {
      css += `
        .btn-primary {
          --bs-btn-color: #fff;
          --bs-btn-bg: ${primaryColor};
          --bs-btn-border-color: ${primaryColor};
          --bs-btn-hover-bg: ${pSBC(-0.10, primaryColor)};
          --bs-btn-hover-border-color: ${pSBC(-0.15, primaryColor)};
          --bs-btn-active-bg: ${pSBC(-0.15, primaryColor)};
          --bs-btn-active-border-color: ${pSBC(-0.20, primaryColor)};
        }
      `;
    }

    // Secondary Button
    if (secondaryColor) {
      css += `
        .btn-secondary {
          --bs-btn-color: #fff;
          --bs-btn-bg: ${secondaryColor};
          --bs-btn-border-color: ${secondaryColor};
          --bs-btn-hover-bg: ${pSBC(-0.10, secondaryColor)};
          --bs-btn-hover-border-color: ${pSBC(-0.15, secondaryColor)};
        }
      `;
    }

    return css;
  });

  return { settings, setTheme, dynamicThemeCss };
});