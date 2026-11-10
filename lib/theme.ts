export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

// Light unless the visitor picked something else, so the site looks the same
// as before dark mode existed until someone opts in.
const DEFAULT_PREFERENCE: ThemePreference = 'light';

// The dark palette, for code that can't read the CSS variables (charts, MUI).
// Keep in sync with .dark in app/globals.css.
export const DARK_COLORS = {
  fg: '#ececec',
  bg: '#191919',
  raised: '#232323',
};

export const readPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Storage can be blocked; fall back to the default.
  }
  return DEFAULT_PREFERENCE;
};

export const resolveTheme = (pref: ThemePreference): ResolvedTheme =>
  pref === 'system'
    ? window.matchMedia(DARK_QUERY).matches
      ? 'dark'
      : 'light'
    : pref;

// Sets the class that the colour variables in app/globals.css key off.
export const applyTheme = (pref: ThemePreference) => {
  document.documentElement.classList.toggle(
    'dark',
    resolveTheme(pref) === 'dark'
  );
};

export const savePreference = (pref: ThemePreference) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Not saved, but still applied for this visit.
  }
};

export const watchSystemTheme = (onChange: () => void) => {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

// Runs in <head> before the page paints, so a dark page never flashes white.
// Mirrors readPreference + applyTheme: dark only if chosen, or if "system"
// was chosen and the device is dark. Nothing saved means light.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(t==='system'&&window.matchMedia('${DARK_QUERY}').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
