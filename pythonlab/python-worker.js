// A terminable worker keeps user Python separate from the lesson interface.
const version = '0.27.7';
let python;
async function initialize() {
  try {
    const { loadPyodide } = await import(`https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`);
    python = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/` });
    const response = await fetch(new URL('./runner.py', import.meta.url));
    if (!response.ok) throw new Error('無法載入課程執行器');
    python.runPython(await response.text());
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'load-error', message: String(error.message || error) });
  }
}
const ready = initialize();
self.onmessage = async ({ data }) => {
  await ready;
  if (!python) return;
  try {
    python.globals.set('__lab_request_json', JSON.stringify(data));
    const result = JSON.parse(python.runPython('_lab_dispatch(__lab_request_json)'));
    python.globals.delete('__lab_request_json');
    self.postMessage({ type: 'result', id: data.id, result });
  } catch (error) {
    self.postMessage({ type: 'runtime-error', id: data.id, message: String(error.message || error) });
  }
};
