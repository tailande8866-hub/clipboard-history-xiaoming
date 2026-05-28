
const e = require('electron');
console.log('electron type:', typeof e);
console.log('has app:', 'app' in e);
if (typeof e === 'object' && e.app) {
  e.app.whenReady().then(() => console.log('READY'));
  e.app.quit();
} else {
  console.log('FAIL: electron module is not object');
  process.exit(1);
}
