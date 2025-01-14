import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ReactBenchmarkHelper } from './utils/benchmarkHelpers';

// Initialize benchmark helper
const benchmarkHelper = new ReactBenchmarkHelper();

// Parse configuration from URL or environment
const params = new URLSearchParams(window.location.search);
const testCase = params.get('test') || 'form';
const config = JSON.parse(params.get('config') || '{}');

// Start performance monitoring
benchmarkHelper.startMeasurement('initialRender');

ReactDOM.render(
  <React.StrictMode>
    <App testCase={testCase} config={config} />
  </React.StrictMode>,
  document.getElementById('root'),
  () => {
    // Record initial render time
    const renderTime = benchmarkHelper.endMeasurement('initialRender');
    console.log('Initial render time:', renderTime);
  }
);

// Export benchmark helper for external use
window.benchmarkHelper = benchmarkHelper;

