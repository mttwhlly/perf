const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { execSync, spawn } = require('child_process');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createServer: createViteServer } = require('vite');
const { performance, PerformanceObserver } = require('perf_hooks');

// Framework configuration
const FRAMEWORK_CONFIGS = {
  'react-router': {
    type: 'vite',
    port: 5173,
    buildCommand: 'npm run build',
    startCommand: null,
    routeFormat: 'direct'
  },
  'vue': {
    type: 'vite',
    port: 5173,
    buildCommand: 'npm run build',
    startCommand: null,
    routeFormat: 'query'
  },
  'svelte': {
    type: 'vite',
    port: 5173,
    buildCommand: 'npm run build',
    startCommand: null,
    routeFormat: 'query'
  },
  'angular': {
    type: 'standalone',
    port: 4200,
    buildCommand: 'ng build',
    startCommand: 'ng serve --port 4200',
    routeFormat: 'query'
  },
  'blazor': {
    type: 'dotnet',
    port: 5000,
    buildCommand: 'dotnet build',
    startCommand: 'dotnet run',
    routeFormat: 'query'
  }
};

// Server startup based on framework type
async function startServer(framework, port) {
  const config = FRAMEWORK_CONFIGS[framework];
  
  switch (config.type) {
    case 'vite':
      return startViteServer(port, framework);
    case 'standalone':
    case 'dotnet':
      return startStandaloneServer(framework, port);
    default:
      throw new Error(`Unknown framework type: ${config.type}`);
  }
}

async function startViteServer(port, framework) {
  const app = express();
  app.use(compression());
  app.use(morgan('tiny'));

  const vite = await createViteServer({
    root: path.join(__dirname, '..', 'test-implementations', `${framework}-app`),
    server: { middlewareMode: true, port },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`${framework} app listening on port ${port}`);
      resolve({ server, type: 'vite' });
    });
  });
}

async function startStandaloneServer(framework, port) {
  const config = FRAMEWORK_CONFIGS[framework];
  const appPath = path.join(__dirname, '..', 'test-implementations', `${framework}-app`);
  const originalDir = process.cwd();

  try {
    process.chdir(appPath);
    const command = config.startCommand.split(' ')[0];
    const args = config.startCommand.split(' ').slice(1);
    
    return new Promise((resolve) => {
      const server = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: port.toString() }
      });

      // Give the server time to start
      setTimeout(() => {
        console.log(`${framework} app listening on port ${port}`);
        resolve({ server, type: config.type });
      }, 5000);
    });
  } finally {
    process.chdir(originalDir);
  }
}

// Build function for different frameworks
async function buildFramework(framework) {
  const config = FRAMEWORK_CONFIGS[framework];
  const frameworkPath = path.join(__dirname, '..', 'test-implementations', `${framework}-app`);
  const originalDir = process.cwd();
  
  try {
    process.chdir(frameworkPath);
    
    if (config.type === 'dotnet') {
      execSync(config.buildCommand, { stdio: 'inherit' });
    } else {
      await new Promise((resolve, reject) => {
        const command = config.buildCommand.split(' ')[0];
        const args = config.buildCommand.split(' ').slice(1);
        
        const build = spawn(command, args, {
          stdio: 'inherit',
          shell: true,
          env: { ...process.env, FORCE_COLOR: true }
        });

        build.on('error', reject);
        build.on('exit', code => code === 0 ? resolve() : reject(new Error(`Build failed with code ${code}`)));
      });
    }
  } catch (error) {
    console.error(`Error building ${framework}:`, error);
    throw error;
  } finally {
    process.chdir(originalDir);
  }
}

// Enhanced metrics collection (preserved from original)
async function collectWebVitals(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      let metrics = {};
      
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          metrics[entry.name] = entry.value;
        });
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics['FCP'] = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });

      setTimeout(() => resolve(metrics), 5000);
    });
  });
}

// Memory leak analysis (preserved from original)
function analyzeMemoryLeaks(memoryTimeSeries) {
  const n = memoryTimeSeries.length;
  if (n < 2) return { hasLeak: false };

  const timestamps = memoryTimeSeries.map(x => x.timestamp);
  const heapSizes = memoryTimeSeries.map(x => x.jsHeapSize);
  
  const sumX = timestamps.reduce((a, b) => a + b, 0);
  const sumY = heapSizes.reduce((a, b) => a + b, 0);
  const sumXY = timestamps.reduce((sum, x, i) => sum + x * heapSizes[i], 0);
  const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  return {
    hasLeak: slope > 1000,
    growthRate: slope,
    unit: 'bytes/ms'
  };
}

// Get URL based on framework configuration
function getScenarioUrl(framework, scenario) {
  const config = FRAMEWORK_CONFIGS[framework];
  const baseUrl = `http://localhost:${config.port}`;
  
  switch (config.routeFormat) {
    case 'direct':
      return `${baseUrl}/${scenario}`;
    case 'query':
      return `${baseUrl}?test=${scenario}`;
    default:
      throw new Error(`Unknown route format: ${config.routeFormat}`);
  }
}

  // Enhanced benchmark helper injection
async function injectBenchmarkHelper(page) {
    await page.evaluate(() => {
      window.benchmarkHelper = {
        async runScenario() {
          const renderTimes = [];
          const memorySnapshots = [];
          const interactionEvents = [];
          
          // Original render time measurement
          performance.mark('renderStart');
          await new Promise(resolve => setTimeout(resolve, 100));
          performance.mark('renderEnd');
          performance.measure('render', 'renderStart', 'renderEnd');
          
          // Enhanced memory tracking
          if (performance.memory) {
            for (let i = 0; i < 5; i++) {
              memorySnapshots.push({
                timestamp: Date.now(),
                ...performance.memory
              });
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          // Track interaction events
          const observer = new PerformanceObserver((list) => {
            interactionEvents.push(...list.getEntries());
          });
          observer.observe({ entryTypes: ['event'] });
          
          // Run scenario-specific measurements
          await this.runScenarioSpecificTests();
          
          return {
            renderTimes,
            memorySnapshots,
            interactionEvents,
            performance: performance.getEntriesByType('measure')
          };
        },
  
        async runScenarioSpecificTests() {
          // Form test
          if (document.querySelector('.form-test')) {
            const form = document.querySelector('.form-test');
            const inputs = form.querySelectorAll('input');
            const submitBtn = form.querySelector('button[type="submit"]');
            
            // Measure input performance
            performance.mark('inputStart');
            inputs.forEach(input => {
              input.value = 'test value';
              input.dispatchEvent(new Event('input'));
            });
            performance.mark('inputEnd');
            performance.measure('input', 'inputStart', 'inputEnd');
            
            // Measure form submission
            performance.mark('submitStart');
            submitBtn.click();
            performance.mark('submitEnd');
            performance.measure('submit', 'submitStart', 'submitEnd');
          }
          
          // Realtime test
          if (document.querySelector('.realtime-test')) {
            performance.mark('realtimeStart');
            await new Promise(resolve => setTimeout(resolve, 1000));
            performance.mark('realtimeEnd');
            performance.measure('realtime', 'realtimeStart', 'realtimeEnd');
          }
          
          // Animation test
          if (document.querySelector('.animation-test')) {
            performance.mark('animationStart');
            await new Promise(resolve => setTimeout(resolve, 1000));
            performance.mark('animationEnd');
            performance.measure('animation', 'animationStart', 'animationEnd');
          }
          
          // WebSocket test
          if (document.querySelector('.websocket-test')) {
            performance.mark('websocketStart');
            await new Promise(resolve => setTimeout(resolve, 1000));
            performance.mark('websocketEnd');
            performance.measure('websocket', 'websocketStart', 'websocketEnd');
          }
          
          // DOM test
          if (document.querySelector('.dom-test')) {
            performance.mark('domStart');
            await new Promise(resolve => setTimeout(resolve, 1000));
            performance.mark('domEnd');
            performance.measure('dom', 'domStart', 'domEnd');
          }
        }
      };
    });
  }

async function runBenchmark(options) {
  let server;
  let browser;

  try {
    // Build frameworks first
    const frameworks = options.framework ? [options.framework] : ['react-router', 'vue', 'svelte', 'angular'];
    for (const framework of frameworks) {
      await buildFramework(framework);
    }

    // Start server
    console.log('Starting server...');
    server = await startViteServer(5173, options.framework || 'react-router');

    // Start browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.coverage.startJSCoverage();
    
    const resultsDir = path.join(__dirname, '..', 'results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const scenarios = options.scenario ? [options.scenario] : ['form', 'realtime', 'animation', 'websocket', 'dom'];
    const results = {};

    for (const framework of frameworks) {
      results[framework] = {};
      
      for (const scenario of scenarios) {
        console.log(`Running ${framework} - ${scenario} benchmark...`);
        
        // React Router uses direct routes
        const url = framework === 'react-router' 
          ? `http://localhost:5173/${scenario}`
          : `http://localhost:5173/${framework}?test=${scenario}`;
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          let retries = 3;
          while (retries > 0) {
            try {
              await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
              });
              break;
            } catch (error) {
              console.log(`Retry ${4 - retries} for ${framework} - ${scenario}`);
              retries--;
              if (retries === 0) throw error;
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }

          // Inject benchmark helper
          await page.evaluate(() => {
            window.benchmarkHelper = {
              async runScenario() {
                const renderTimes = [];
                const memorySnapshots = [];
                
                // Measure render time
                performance.mark('renderStart');
                await new Promise(resolve => setTimeout(resolve, 100));
                performance.mark('renderEnd');
                performance.measure('render', 'renderStart', 'renderEnd');
                
                // Collect memory usage
                if (performance.memory) {
                  memorySnapshots.push(performance.memory);
                }
                
                return {
                  renderTimes,
                  memorySnapshots,
                  performance: performance.getEntriesByType('measure')
                };
              }
            };
          });

          const scenarioResults = await page.evaluate(async () => {
            return await window.benchmarkHelper.runScenario();
          });
          
          const metrics = await page.metrics();
          const performance = await page.evaluate(() => 
            JSON.stringify(window.performance.getEntriesByType('measure'))
          );
          
          results[framework][scenario] = {
            ...scenarioResults,
            metrics,
            performance: JSON.parse(performance)
          };
        } catch (error) {
          console.error(`Error running benchmark for ${framework} - ${scenario}:`, error);
          results[framework][scenario] = { error: error.message };
        }
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `benchmark-${timestamp}.json`);
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
    const summary = generateSummary(results);
  
    await fs.writeFile(
      resultsFile, 
      JSON.stringify({
        summary,
        results,
        metadata: {
          timestamp,
          node: process.version,
          env: process.env.NODE_ENV
        }
      }, null, 2)
    );

    console.log(`\nBenchmark complete! Results saved to: ${resultsFile}`);

  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (server) {
        try {
          if (server.type === 'vite') {
            await new Promise((resolve) => {
              server.server.close(() => {
                console.log('Vite server closed');
                resolve();
              });
            });
          } else if (server.type === 'standalone' || server.type === 'dotnet') {
            // For Angular/Blazor processes, we need to kill the spawned process
            server.server.kill('SIGTERM');
            // Give it a moment to clean up
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`${server.type} server terminated`);
          }
        } catch (error) {
          console.error('Error closing server:', error);
        }
      }
  }
}

// CLI setup
program
  .option('-f, --framework <framework>', 'Specific framework to test')
  .option('-s, --scenario <scenario>', 'Specific scenario to test')
  .option('-i, --iterations <number>', 'Number of iterations', parseInt)
  .option('-w, --warmup <number>', 'Number of warmup runs', parseInt)
  .parse(process.argv);

// Helper functions
function calculateAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculatePercentile(numbers, percentile) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function generateSummary(results) {
  const summary = {};
  
  for (const [framework, scenarios] of Object.entries(results)) {
    summary[framework] = {};
    
    for (const [scenario, data] of Object.entries(scenarios)) {
      if (data.error) {
        summary[framework][scenario] = {
          error: data.error
        };
        continue;
      }

      const metrics = data.metrics || {};
      summary[framework][scenario] = {
        averageRenderTime: calculateAverage(data.renderTimes || []),
        jsHeapSize: formatBytes(metrics.JSHeapUsedSize || 0),
        scriptDuration: metrics.ScriptDuration || 0,
        taskDuration: metrics.TaskDuration || 0,
      };
    }
  }
  
  return summary;
}

function getFrameworkConfig(framework) {
    const config = FRAMEWORK_CONFIGS[framework];
    if (!config) {
      throw new Error(`Unknown framework: ${framework}`);
    }
    return config;
  }
  
async function verifyFrameworkSetup(framework) {
const config = getFrameworkConfig(framework);
const frameworkPath = path.join(__dirname, '..', 'test-implementations', `${framework}-app`);

try {
    const stats = await fs.stat(frameworkPath);
    if (!stats.isDirectory()) {
    throw new Error(`Framework path for ${framework} is not a directory`);
    }
    
    // Check for package.json except for Blazor
    if (config.type !== 'dotnet') {
    const packageJsonPath = path.join(frameworkPath, 'package.json');
    await fs.access(packageJsonPath);
    }
    
    return true;
} catch (error) {
    console.error(`Framework ${framework} is not properly set up:`, error.message);
    return false;
}
}

module.exports = {
    // Core functionality
    runBenchmark,
    startServer,
    buildFramework,
    
    // Server management
    startViteServer,
    startStandaloneServer,
    
    // Metrics collection
    collectWebVitals,
    analyzeMemoryLeaks,
    injectBenchmarkHelper,
    
    // Configuration and helpers
    FRAMEWORK_CONFIGS,
    getFrameworkConfig,
    verifyFrameworkSetup,
    getScenarioUrl,
    
    // Analysis helpers
    calculateAverage,
    calculatePercentile,
    formatBytes,
    generateSummary
  };
  
  // Run benchmark if script is executed directly
  if (require.main === module) {
    const options = program.opts();
    
    // Verify framework setup before running
    if (options.framework) {
      verifyFrameworkSetup(options.framework)
        .then(isValid => {
          if (isValid) {
            return runBenchmark(options);
          } else {
            console.error(`Cannot run benchmark: ${options.framework} is not properly set up`);
            process.exit(1);
          }
        })
        .catch(console.error);
    } else {
      runBenchmark(options).catch(console.error);
    }
  }