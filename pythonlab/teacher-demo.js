// Generated from teacher-demo.js by npm run build:lesson-plans.
(() => {
  const key = 'unforte115:teacher-demo';
  const showAll = () => new URLSearchParams(location.search).get('route') === 'all';
  const isRequested = () => new URLSearchParams(location.search).get('teacher') === '1' || showAll();

  function set(enabled) {
    try {
      if (enabled) sessionStorage.setItem(key, '1');
      else sessionStorage.removeItem(key);
    } catch { /* An explicit URL still works when storage is unavailable. */ }
  }

  function isOn() {
    if (isRequested()) {
      set(true);
      return true;
    }
    try { return sessionStorage.getItem(key) === '1'; } catch { return false; }
  }

  function end() {
    set(false);
    const url = new URL(location.href);
    url.searchParams.delete('teacher');
    if (showAll()) url.searchParams.delete('route');
    location.replace(url.href);
  }

  function toggle() {
    const enabled = isOn();
    if (enabled && isRequested()) end();
    else set(!enabled);
  }

  window.TeacherDemo = { isOn, toggle, showAll, end };
})();
