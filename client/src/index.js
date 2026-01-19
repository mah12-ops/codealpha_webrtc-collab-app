import { Buffer } from 'buffer';
import process from 'process';

window.global = window;
window.Buffer = Buffer;
window.process = process; // Use the actual process polyfill
// Add specific overrides for the browser
window.process.nextTick = (fn) => setTimeout(fn, 0);
window.process.env = { DEBUG: undefined };

const React = require('react');
const ReactDOM = require('react-dom/client');
require('./index.css');
const App = require('./App').default;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);