import React from 'react';
import ReactDOM from 'react-dom';

export class ReactBenchmarkHelper {
    constructor() {
      this.measurements = {
        renderTimes: [],
        interactionTimes: [],
        memorySnapshots: [],
        performanceMarks: new Map()
      };
    }
  
    startMeasurement(name) {
      this.performanceMarks.set(name, performance.now());
    }
  
    endMeasurement(name) {
      const startTime = this.performanceMarks.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        this.performanceMarks.delete(name);
        return duration;
      }
      return null;
    }
  
    async captureMemorySnapshot() {
      if (performance.memory) {
        this.memorySnapshots.push({
          timestamp: Date.now(),
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        });
      }
    }
  
    recordRenderTime(component, props) {
      return new Promise(resolve => {
        const start = performance.now();
        ReactDOM.render(
          React.createElement(component, props),
          document.createElement('div'),
          () => {
            const duration = performance.now() - start;
            this.renderTimes.push(duration);
            resolve(duration);
          }
        );
      });
    }
  
    async measureInteraction(interaction) {
      const start = performance.now();
      await interaction();
      const duration = performance.now() - start;
      this.interactionTimes.push(duration);
      return duration;
    }
  
    generateReport() {
      return {
        renderPerformance: {
          average: this.calculateAverage(this.renderTimes),
          median: this.calculateMedian(this.renderTimes),
          p95: this.calculatePercentile(this.renderTimes, 95),
          min: Math.min(...this.renderTimes),
          max: Math.max(...this.renderTimes)
        },
        interactionPerformance: {
          average: this.calculateAverage(this.interactionTimes),
          median: this.calculateMedian(this.interactionTimes),
          p95: this.calculatePercentile(this.interactionTimes, 95)
        },
        memoryUsage: this.analyzeMemoryUsage(),
        timestamp: new Date().toISOString()
      };
    }
  
    calculateAverage(numbers) {
      return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
  
    calculateMedian(numbers) {
      const sorted = [...numbers].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    }
  
    calculatePercentile(numbers, percentile) {
      const sorted = [...numbers].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[index];
    }
  
    analyzeMemoryUsage() {
      if (this.memorySnapshots.length === 0) return null;
  
      const heapSizes = this.memorySnapshots.map(snapshot => snapshot.usedJSHeapSize);
      return {
        initialHeapSize: heapSizes[0],
        finalHeapSize: heapSizes[heapSizes.length - 1],
        peakHeapSize: Math.max(...heapSizes),
        heapGrowth: heapSizes[heapSizes.length - 1] - heapSizes[0]
      };
    }
  }