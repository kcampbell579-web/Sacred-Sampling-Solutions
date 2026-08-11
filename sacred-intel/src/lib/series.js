// The three flagship series. Each has an accent color used for badges,
// episode artwork gradients, and series landing pages.
export const SERIES = {
  'Disaster Files': {
    slug: 'disaster-files',
    color: '#EF4444',
    blurb:
      'Anatomies of catastrophe — bridge collapses, industrial explosions, and the environmental disasters that reshaped how we think about risk.',
    long:
      'Disaster Files reconstructs how catastrophes actually happen: the decisions, the warnings that went unheeded, and the science of failure. Each episode traces a single event from first cause to final consequence.',
  },
  'Deep Dives': {
    slug: 'deep-dives',
    color: '#8B5CF6',
    blurb:
      'Long-form investigations into the contaminants and systems shaping modern life — PFAS, microplastics, air quality, and the research behind them.',
    long:
      'Deep Dives goes past the headline and into the peer-reviewed record. We unpack the chemistry, the epidemiology, and the policy fights behind the exposures that touch everyday life.',
  },
  'Behind the Headlines': {
    slug: 'behind-the-headlines',
    color: '#F59E0B',
    blurb:
      'The context the news cycle skips — what a breaking safety or environmental story actually means, and what the data really says.',
    long:
      'Behind the Headlines takes a story that is dominating the feed and asks the question everyone skips: what does the evidence actually show? Fast, sourced, and skeptical.',
  },
};

export const seriesList = Object.entries(SERIES).map(([name, v]) => ({ name, ...v }));

export const seriesBySlug = Object.fromEntries(
  seriesList.map((s) => [s.slug, s])
);

export function seriesInfo(name) {
  return SERIES[name] || { slug: '', color: '#8B5CF6', blurb: '', long: '' };
}
