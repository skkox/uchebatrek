// Простой маршрутизатор по адресу после «#», например #/task/t1?mode=edit.
// Страница не перезагружается: при смене адреса вызывается нужный обработчик.

const Router = (() => {
  const routes = [];

  // add('/course/:id', handler) -> регулярное выражение с именованными частями
  function add(pattern, handler) {
    const keys = [];
    const source = pattern.replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    routes.push({ regex: new RegExp('^' + source + '$'), keys, handler });
  }

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    return { path, query: new URLSearchParams(query) };
  }

  function resolve() {
    const { path, query } = parse();
    for (const route of routes) {
      const match = path.match(route.regex);
      if (!match) continue;
      const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });
      route.handler(params, query);
      return;
    }
    go('/home');
  }

  function go(path) {
    if (location.hash === '#' + path) resolve();
    else location.hash = path;
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { add, go, start, refresh: resolve, path: () => parse().path };
})();
