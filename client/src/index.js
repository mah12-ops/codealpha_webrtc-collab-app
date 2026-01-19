import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
window.process = require('process');
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: (fn) => setTimeout(fn, 0),
  listeners: () => [],
  on: () => {},
  removeListener: () => {}
};

// Use require here to ensure process is defined before App components load simple-peer
const React = require('react');
const ReactDOM = require('react-dom/client');
require('./index.css');
const App = require('./App').default;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);