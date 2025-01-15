module.exports = {
    frameworks: ['react', 'vue', 'svelte', 'angular', 'blazor'],
    scenarios: ['form', 'realtime', 'animation', 'websocket', 'dom'],
    metrics: {
      tti: true,
      codeSplitting: true,
      stateManagement: true,
      routeTransitions: true,
      ssr: true
    },
    reporters: ['json', 'html', 'console'],
    environments: ['chrome', 'firefox', 'edge'],
    iterations: 5,
    warmupIterations: 2
  };