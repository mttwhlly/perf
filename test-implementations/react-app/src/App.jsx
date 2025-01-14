import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import {
  ComplexForm,
  RealtimeUpdates,
  AnimationTest,
  WebSocketTest,
  DOMTest
} from './components';

const App = ({ testCase, config }) => {
  const components = {
    form: ComplexForm,
    realtime: RealtimeUpdates,
    animation: AnimationTest,
    websocket: WebSocketTest,
    dom: DOMTest
  };

  const TestComponent = components[testCase];

  if (!TestComponent) {
    return <div>Invalid test case specified</div>;
  }

  return (
    <Provider store={store}>
      <div className="benchmark-container">
        <TestComponent {...config} />
      </div>
    </Provider>
  );
};

export default App;