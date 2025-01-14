import React from 'react';
import ReactDOM from 'react-dom';

export class ReactTestHelper {
    static async simulateUserInput(element, value) {
      const event = new Event('change', { bubbles: true });
      element.value = value;
      element.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  
    static async simulateClick(element) {
      const event = new MouseEvent('click', { bubbles: true });
      element.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  
    static async simulateFormSubmit(form) {
      const event = new Event('submit', { bubbles: true });
      form.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  
    static async simulateScroll(element, position) {
      const event = new Event('scroll', { bubbles: true });
      element.scrollTop = position;
      element.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  
    static createVirtualizedData(count) {
      return Array.from({ length: count }, (_, index) => ({
        id: index,
        content: `Item ${index}`,
        metadata: {
          timestamp: Date.now(),
          random: Math.random()
        }
      }));
    }
  
    static async measureRenderCost(component, props, iterations = 100) {
      const times = [];
      const container = document.createElement('div');
      document.body.appendChild(container);
  
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        ReactDOM.render(React.createElement(component, props), container);
        const end = performance.now();
        times.push(end - start);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
  
      document.body.removeChild(container);
      return {
        average: times.reduce((a, b) => a + b) / times.length,
        median: times.sort()[Math.floor(times.length / 2)],
        min: Math.min(...times),
        max: Math.max(...times)
      };
    }
  }