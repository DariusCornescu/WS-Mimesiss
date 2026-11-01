const base = new URL(process.env.PERFORMANCE_BASE_URL || 'https://asmm.ro');
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Use an HTTP(S) performance URL');

module.exports = {
  ci: {
    collect: {
      url: ['/', '/despre', '/proiecte', '/contact', '/congres'].map(path => new URL(path, base).href),
      numberOfRuns: 3,
      settings: { preset: 'perf' },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median' }],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod: 'median' }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800, aggregationMethod: 'median' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
