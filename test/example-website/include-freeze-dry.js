// Snowpack builds & serves the src directory at /freeze-dry
import * as freezeDryModule from '/freeze-dry/index.js';
const freezeDry = freezeDryModule.default;

window.freezeDryModule = freezeDryModule;
window.freezeDry = freezeDry;
window.freezeDryAndShow = async function freezeDryAndShow(...args) {
  const html = await freezeDry(...args);
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl);
}
