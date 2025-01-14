import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock performance API
if (!window.performance) {
  window.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    }
  };
}