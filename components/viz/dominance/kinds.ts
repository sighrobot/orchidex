import type { DominanceKind } from 'lib/fetchers/dominance';

// What differs between the dominance charts: colors and wording.
export type KindConfig = {
  // Each group takes the color at its all-time rank, cycling, so it keeps
  // its color however the chart is zoomed or labeled.
  palette: string[];
  one: string;
  many: string;
  // Genus names are italicized, as scientific names are; registrants aren't.
  italic: boolean;
  // How the guide's first step describes the bars.
  bars: string;
  // How the guide says an early leader has gone, if it has.
  gone: string;
  // The group the guide's last step zooms in on, by name. Without one, or
  // if it's missing from the data, a big group from the latest year.
  focus?: string;
};

export const KINDS: Record<DominanceKind, KindConfig> = {
  genus: {
    // The original chart's colors, in its order (royalblue appears twice
    // there too).
    palette: [
      '#8a3ffc',
      '#33b1ff',
      '#007d79',
      '#ff7eb6',
      '#fa4d56',
      '#6fdc8c',
      '#4589ff',
      '#d12771',
      '#ffa500',
      '#40e0d0',
      '#08bdba',
      '#bae6ff',
      '#ee82ee',
      '#d4bbff',
      '#4169e1',
      '#4169e1',
      '#663399',
      '#a96af7',
    ],
    one: 'genus',
    many: 'genera',
    italic: true,
    bars: 'a bar per genus by its share of the year',
    gone: 'all but vanished',
  },
  registrant: {
    // The original chart's colors, in its order (gray appears twice there
    // too).
    palette: [
      '#8a3ffc',
      '#33b1ff',
      '#007d79',
      '#ff7eb6',
      '#fa4d56',
      '#6fdc8c',
      '#4589ff',
      '#d12771',
      '#ffd700',
      '#08bdba',
      '#bae6ff',
      '#ba4e00',
      '#d4bbff',
      '#800080',
      '#808080',
      '#808080',
    ],
    one: 'registrant',
    many: 'registrants',
    italic: false,
    bars: 'a bar per registrant, the person or organization who registered them, by their share of the year',
    gone: 'had all but stopped registering',
    focus: 'D.S.Santoso',
  },
};
