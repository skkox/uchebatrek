// Каркас приложения: шапка, боковое меню, уведомления, переключатель темы.

const Theme = {
  current() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  },

  apply(name) {
    document.documentElement.dataset.theme = name;
    try {
      localStorage.setItem(CONFIG.themeKey, name);
    } catch (error) {
      console.warn(error);
    }
  },

  init() {
    let saved = null;
    try {
      saved = localStorage.getItem(CONFIG.themeKey);
    } catch (error) {
      console.warn(error);
    }
    document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark';
  },
};

const Layout = {
  menuFor(user) {
    if (user.role === 'teacher') {
      return [
        ['home', 'Главная', 'home'],
        ['review', 'Проверка работ', 'review'],
        ['courses', 'Курсы', 'book'],
        ['grades', 'Журнал', 'chart'],
        ['calendar', 'Календарь', 'calendar'],
        ['profile', 'Профиль', 'user'],
      ];
    }
    return [
      ['home', 'Главная', 'home'],
      ['courses', 'Курсы', 'book'],
      ['grades', 'Оценки', 'chart'],
      ['calendar', 'Календарь', 'calendar'],
      ['profile', 'Профиль', 'user'],
    ];
  },

  notificationsHtml(user) {
    const list = Db.notificationsOf(user.id).slice(0, 8);
    const items = list.length
      ? list.map(n => `
          <button class="popover__item ${n.read ? '' : 'is-unread'}" type="button" data-note="${n.id}" data-link="${Utils.escape(n.link)}">
            ${Utils.escape(n.text)}
            <span class="popover__time">${Utils.formatDateTime(n.createdAt)}</span>
          </button>`).join('')
      : '<div class="popover__empty">' + UI.empty('Уведомлений пока нет', 'bell') + '</div>';
    return `
      <div class="popover__head">
        <span>Уведомления</span>
        <button class="btn btn-secondary btn-sm" type="button" id="read-all">Прочитать все</button>
      </div>
      <div class="popover__list">${items}</div>`;
  },

  // Рисует каркас и вставляет в него содержимое страницы.
  // Возвращает элемент содержимого, чтобы страница могла навесить обработчики.
  render(active, html) {
    const user = Auth.current();
    const unread = Db.notificationsOf(user.id).filter(n => !n.read).length;
    const pending = user.role === 'teacher'
      ? Db.submissionsForTeacher(user).filter(s => s.status === 'sent').length
      : 0;

    const menu = Layout.menuFor(user).map(([key, label, icon]) => `
      <a class="sidebar__link ${key === active ? 'is-active' : ''}" href="#/${key}" ${key === active ? 'aria-current="page"' : ''}>
        ${UI.icon(icon)}<span>${label}</span>
        ${key === 'review' && pending ? `<span class="sidebar__badge">${pending}</span>` : ''}
      </a>`).join('');

    document.getElementById('root').innerHTML = `
      <div class="app">
        <header class="topbar">
          <button class="icon-btn burger" id="burger" type="button" aria-label="Открыть меню" aria-expanded="false">${UI.icon('menu')}</button>
          <a class="brand" href="#/home"><img src="assets/logo.svg" alt=""><span>УчебаТрек</span></a>
          <div class="topbar__spacer"></div>
          <button class="icon-btn" id="theme-btn" type="button" aria-label="Сменить тему оформления">${UI.icon(Theme.current() === 'dark' ? 'sun' : 'moon')}</button>
          <div class="bell">
            <button class="icon-btn" id="bell-btn" type="button" aria-label="Уведомления: ${unread} новых" aria-expanded="false">
              ${UI.icon('bell')}${unread ? `<span class="icon-btn__badge">${unread}</span>` : ''}
            </button>
            <div class="popover" id="bell-panel" hidden></div>
          </div>
          <a class="user-chip" href="#/profile">
            ${UI.avatar(user.name)}
            <span class="user-chip__text">
              <span class="user-chip__name">${Utils.escape(Utils.shortName(user.name))}</span>
              <span class="user-chip__role">${user.role === 'teacher' ? 'Преподаватель' : 'Студент'}</span>
            </span>
          </a>
          <button class="icon-btn" id="logout-btn" type="button" aria-label="Выйти">${UI.icon('logout')}</button>
        </header>
        <div class="workspace">
          <nav class="sidebar" id="sidebar" aria-label="Основное меню">${menu}</nav>
          <div class="overlay" id="overlay"></div>
          <main class="content" id="content" tabindex="-1">${html}</main>
        </div>
      </div>`;

    Layout.bind(user);
    window.scrollTo(0, 0);
    return document.getElementById('content');
  },

  // Обновляет счётчик непроверенных работ в меню без перерисовки страницы
  updatePendingBadge() {
    const user = Auth.current();
    const link = document.querySelector('.sidebar__link[href="#/review"]');
    if (!user || !link) return;
    const pending = Db.submissionsForTeacher(user).filter(s => s.status === 'sent').length;
    let badge = link.querySelector('.sidebar__badge');
    if (!pending && badge) badge.remove();
    if (pending && !badge) {
      badge = document.createElement('span');
      badge.className = 'sidebar__badge';
      link.appendChild(badge);
    }
    if (badge) badge.textContent = pending;
  },

  bind(user) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const burger = document.getElementById('burger');
    const panel = document.getElementById('bell-panel');
    const bell = document.getElementById('bell-btn');

    const setMenu = open => {
      sidebar.classList.toggle('is-open', open);
      overlay.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => setMenu(!sidebar.classList.contains('is-open')));
    overlay.addEventListener('click', () => setMenu(false));
    sidebar.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });

    document.getElementById('theme-btn').addEventListener('click', () => {
      Theme.apply(Theme.current() === 'dark' ? 'light' : 'dark');
      document.getElementById('theme-btn').innerHTML = UI.icon(Theme.current() === 'dark' ? 'sun' : 'moon');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.logout();
      Router.go('/login');
    });

    // Панель уведомлений
    bell.addEventListener('click', event => {
      event.stopPropagation();
      const open = panel.hidden;
      if (open) panel.innerHTML = Layout.notificationsHtml(user);
      panel.hidden = !open;
      bell.setAttribute('aria-expanded', String(open));
    });

    panel.addEventListener('click', event => {
      event.stopPropagation();
      const item = event.target.closest('[data-note]');
      if (item) {
        Db.markRead(item.dataset.note);
        Router.go(item.dataset.link);
      }
      if (event.target.closest('#read-all')) {
        Db.markAllRead(user.id);
        Router.refresh();
      }
    });

    document.addEventListener('click', () => { panel.hidden = true; }, { once: true });
  },
};
