const googleTrends = require('google-trends-api');

function isTrendsModeEnabled() {
  return String(process.env.GOOGLE_TRENDS_MODE || 'true').toLowerCase() !== 'false';
}

/** Map country → Google Trends geo code */
const GEO = {
  US: 'US',
  USA: 'US',
  'UNITED STATES': 'US',
  CA: 'CA',
  CANADA: 'CA',
  UK: 'GB',
  GB: 'GB',
  'UNITED KINGDOM': 'GB',
  AU: 'AU',
  AUSTRALIA: 'AU',
  IN: 'IN',
  INDIA: 'IN',
  GLOBAL: '',
};

function resolveGeo(country = 'US') {
  const key = String(country || 'US').trim().toUpperCase();
  if (key === 'GLOBAL' || key === '') return '';
  return GEO[key] ?? 'US';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, { retries = 2, delayMs = 800 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries) await sleep(delayMs * (i + 1));
    }
  }
  throw lastErr;
}

function parseInterestTimeline(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const timeline =
      parsed?.default?.timelineData ||
      parsed?.default?.timeline_data ||
      [];
    return timeline.map((row) => ({
      time: row.formattedTime || row.time || null,
      value: Array.isArray(row.value) ? Number(row.value[0]) || 0 : Number(row.value) || 0,
    }));
  } catch {
    return [];
  }
}

function summarizeSeasonality(points = []) {
  if (!points.length) {
    return {
      trendDirection: 'unknown',
      seasonality: 'unknown',
      averageInterest: null,
      peakInterest: null,
      rising: false,
    };
  }

  const values = points.map((p) => p.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const peak = Math.max(...values);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const avgFirst =
    firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const avgSecond =
    secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);

  let trendDirection = 'stable';
  if (avgSecond > avgFirst * 1.15) trendDirection = 'rising';
  else if (avgSecond < avgFirst * 0.85) trendDirection = 'declining';

  const variance =
    values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  const seasonality =
    variance > 400 ? 'strong' : variance > 150 ? 'moderate' : 'steady';

  return {
    trendDirection,
    seasonality,
    averageInterest: Math.round(avg),
    peakInterest: peak,
    rising: trendDirection === 'rising',
  };
}

/**
 * Interest over time + seasonality summary for a keyword.
 */
async function getTrendSignals({
  keyword,
  country = 'US',
  timeframe = 'today 12-m',
} = {}) {
  const q = String(keyword || '').trim();
  if (!q) {
    return {
      mode: 'none',
      dataLabel: 'estimate',
      summary: null,
      timeline: [],
      error: 'Keyword required',
    };
  }

  if (!isTrendsModeEnabled()) {
    return {
      mode: 'disabled',
      dataLabel: 'estimate',
      summary: {
        trendDirection: 'unknown',
        seasonality: 'unknown',
        averageInterest: null,
        peakInterest: null,
        rising: false,
      },
      timeline: [],
      note: 'GOOGLE_TRENDS_MODE is false',
    };
  }

  try {
    const geo = resolveGeo(country);
    const raw = await withRetry(() =>
      googleTrends.interestOverTime({
        keyword: q,
        startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        geo,
        // timeframe ignored by some versions; startTime used instead
      })
    );

    const timeline = parseInterestTimeline(raw);
    const summary = summarizeSeasonality(timeline);

    return {
      mode: 'google_trends',
      dataLabel: timeline.length ? 'real' : 'estimate',
      summary,
      timeline: timeline.slice(-24), // last ~points for response size
      geo: geo || 'GLOBAL',
      timeframe,
    };
  } catch (err) {
    console.warn('[nicheengines/googleTrends] failed:', err.message);
    return {
      mode: 'error',
      dataLabel: 'estimate',
      summary: {
        trendDirection: 'unknown',
        seasonality: 'unknown',
        averageInterest: null,
        peakInterest: null,
        rising: false,
      },
      timeline: [],
      error: err.message,
    };
  }
}

module.exports = {
  isTrendsModeEnabled,
  getTrendSignals,
  resolveGeo,
  summarizeSeasonality,
};
