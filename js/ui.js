// Общие элементы интерфейса: иконки, плашки статусов, уведомления, модальные окна.

const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  review: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  file: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  left: '<polyline points="15 18 9 12 15 6"/>',
  right: '<polyline points="9 18 15 12 9 6"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
};

const UI = {
  icon(name, size = 20) {
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
      `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
      `${ICONS[name] || ''}</svg>`;
  },

  chip(statusKey) {
    const status = STATUS[statusKey];
    return `<span class="chip chip-${status.tone}">${status.label}</span>`;
  },

  avatar(fullName, extraClass = '') {
    return `<span class="avatar ${extraClass}" aria-hidden="true">${Utils.escape(Utils.initials(fullName))}</span>`;
  },

  empty(text, icon = 'inbox') {
    return `<div class="empty">${UI.icon(icon, 36)}<div>${Utils.escape(text)}</div></div>`;
  },

  // Короткое сообщение внизу экрана
  toast(message, type = 'ok') {
    const box = document.getElementById('toasts');
    const item = document.createElement('div');
    item.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    item.setAttribute('role', type === 'error' ? 'alert' : 'status');
    item.textContent = message;
    box.appendChild(item);
    setTimeout(() => item.remove(), 3500);
  },

  // Модальное окно. Возвращает { body, close }, в body можно вставлять форму.
  modal({ title, body }) {
    const root = document.getElementById('modal-root');
    const previousFocus = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal__head">
          <h2 id="modal-title">${Utils.escape(title)}</h2>
          <button class="icon-btn" type="button" data-close aria-label="Закрыть">${UI.icon('x')}</button>
        </div>
        <div class="modal__body">${body}</div>
      </div>`;
    root.appendChild(backdrop);

    const close = () => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    };
    const onKey = event => { if (event.key === 'Escape') close(); };

    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) close(); });
    backdrop.querySelector('[data-close]').addEventListener('click', close);

    const first = backdrop.querySelector('input, select, textarea, button.btn');
    if (first) first.focus();

    return { body: backdrop.querySelector('.modal__body'), close };
  },

  // Окно подтверждения, возвращает Promise<boolean>
  confirm({ title, text, okText = 'Подтвердить', danger = false }) {
    return new Promise(resolve => {
      const modal = UI.modal({
        title,
        body: `<p>${Utils.escape(text)}</p>
          <div class="modal__actions">
            <button class="btn btn-secondary" type="button" data-answer="no">Отмена</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-answer="yes">${Utils.escape(okText)}</button>
          </div>`,
      });
      modal.body.addEventListener('click', event => {
        const button = event.target.closest('[data-answer]');
        if (!button) return;
        modal.close();
        resolve(button.dataset.answer === 'yes');
      });
    });
  },
};
