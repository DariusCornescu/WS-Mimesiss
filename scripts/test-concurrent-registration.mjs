// Compatibility entry point: actual source, owned local replica set, no .env.
process.env.STRESS_LEVELS ??= '25'
await import('./stress-local.mjs')
