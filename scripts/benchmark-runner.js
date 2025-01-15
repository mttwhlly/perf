const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { execSync } = require('child_process');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createServer: createViteServer } = require('vite');

async function startViteServer(port, framework) {
  const app = express();
  app.use(compression());
  app.use(morgan('tiny'));

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    root: path.join(__dirname, '..', 'test-implementations', `${framework}-app`),
    server: {
      middlewareMode: true,
      port: port
    },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`${framework} app listening on port ${port}`);
      resolve(server);
    });
  });
}

async function buildFramework(framework) {
  console.log(`Building ${framework}...`);
  const frameworkPath = path.join(__dirname, '..', 'test-implementations', `${framework}-app`);
  
  try {
    const originalDir = process.cwd();
    console.log(`Changing to directory: ${frameworkPath}`);
    process.chdir(frameworkPath);
    
    if (framework === 'react-router') {
      console.log('Running React Router build...');
      await new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        const build = spawn('npm', ['run', 'build'], {
          stdio: 'inherit',
          shell: true,
          env: { ...process.env, FORCE_COLOR: true }
        });

        build.on('error', (err) => {
          console.error('Build process error:', err);
          reject(err);
        });

        build.on('exit', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build process exited with code ${code}`));
          }
        });
      });
    } else {
      execSync('npm run build', { 
        stdio: 'inherit',
        maxBuffer: 1024 * 1024 * 10
      });
    }
    
    process.chdir(originalDir);
  } catch (error) {
    console.error(`Error building ${framework}:`, error);
    try {
      process.chdir(originalDir);
    } catch (cdError) {
      console.error('Error returning to original directory:', cdError);
    }
    throw error;
  }
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
    if (server) server.close();
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

runBenchmark(program.opts()).catch(console.error);