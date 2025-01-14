export default {
    scenarios: {
      form: {
        fields: 50,
        validations: ['required', 'email', 'pattern'],
        dependencies: true,
        submitCount: 1000
      },
      realtime: {
        updateFrequency: 60,
        dataSize: 1000,
        transformations: ['sort', 'filter', 'aggregate']
      },
      animation: {
        css: {
          elements: 1000,
          duration: 1000
        },
        canvas: {
          particles: 10000,
          fps: 60
        },
        svg: {
          paths: 1000,
          morphing: true
        }
      },
      websocket: {
        messageSize: 1024,
        messageFrequency: 100,
        reconnectStrategy: {
          attempts: 5,
          backoff: 'exponential'
        }
      },
      dom: {
        list: {
          items: 10000,
          template: {
            nesting: 3,
            elements: 5
          }
        },
        virtualScroll: {
          windowSize: 50,
          totalItems: 100000
        },
        updates: {
          frequency: 60,
          batchSize: 100
        }
      }
    },
    measurement: {
      iterations: 5,
      warmup: 1,
      cooldown: 1000,
      samplingRate: 60
    },
    reporting: {
      format: 'json',
      saveToFile: true,
      includeRawData: true,
      generateCharts: true
    }
  };