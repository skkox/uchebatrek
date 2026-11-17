// Профиль: данные пользователя, смена пароля, тема, сброс демонстрационных данных.

const ProfilePage = {
  render() {
    const user = Auth.current();
    const isTeacher = Auth.isTeacher(user);

    let stats;
    if (isTeacher) {
      const submissions = Db.submissionsForTeacher(user);
      stats = [
        [Db.coursesFor(user).length, 'курсов'],
        [Db.tasksFor(user).length, 'заданий'],
        [submissions.filter(s => s.status === 'checked').length, 'работ проверено'],
      ];
    } else {
      const mine = Db.submissionsOfUser(user.id);
      const average = Tasks.averagePercent(user.id);
      stats = [
        [mine.length, 'работ сдано'],
        [mine.filter(s => s.status === 'checked').length, 'оценок получено'],
        [average === null ? '—' : average + '%', 'средний результат'],
      ];
    }

    const groupOptions = CONFIG.groups
      .map(g => `<option ${g === user.group ? 'selected' : ''}>${g}</option>`).join('');

    const content = Layout.render('profile', `
      <div class="page-head"><div><h1>Профиль</h1></div></div>

      <div class="grid grid-side">
        <section class="card">
          <div class="profile-head">
            ${UI.avatar(user.name, 'avatar-lg')}
            <div>
              <h2>${Utils.escape(user.name)}</h2>
              <div class="muted">${isTeacher ? 'Преподаватель' : 'Студент · группа ' + Utils.escape(user.group)}</div>
              <div class="muted">${Utils.escape(user.email)}</div>
            </div>
          </div>
          <div class="grid grid-3">
            ${stats.map(([value, label]) => `
              <div><div class="stat__value">${value}</div><div class="stat__label">${label}</div></div>`).join('')}
          </div>
        </section>

        <section class="card">
          <h3>Личные данные</h3>
          <form id="profile-form" novalidate>
            <div class="field">
              <label for="p-name">ФИО</label>
              <input class="input" id="p-name" value="${Utils.escape(user.name)}">
            </div>
            ${isTeacher ? '' : `
            <div class="field">
              <label for="p-group">Группа</label>
              <select class="select" id="p-group">${groupOptions}</select>
            </div>`}
            <p class="field-error" id="profile-error" role="alert"></p>
            <button class="btn btn-primary" type="submit">Сохранить</button>
          </form>
        </section>

        <section class="card">
          <h3>Смена пароля</h3>
          <form id="password-form" novalidate>
            <div class="field">
              <label for="old-pass">Текущий пароль</label>
              <input class="input" id="old-pass" type="password" autocomplete="current-password">
            </div>
            <div class="field">
              <label for="new-pass">Новый пароль</label>
              <input class="input" id="new-pass" type="password" autocomplete="new-password">
            </div>
            <p class="field-error" id="password-error" role="alert"></p>
            <button class="btn btn-primary" type="submit">Изменить пароль</button>
          </form>
        </section>

        <section class="card">
          <h3>Оформление и данные</h3>
          <div class="field">
            <span class="label">Тема</span>
            <div class="theme-switch">
              <button class="btn btn-secondary btn-sm" type="button" data-theme="dark">${UI.icon('moon', 16)} Тёмная</button>
              <button class="btn btn-secondary btn-sm" type="button" data-theme="light">${UI.icon('sun', 16)} Светлая</button>
            </div>
          </div>
          <div class="field">
            <span class="label">Демонстрационные данные</span>
            <p class="muted">Все данные хранятся только в этом браузере. Сброс вернёт стартовые курсы, задания и оценки и удалит загруженные файлы.</p>
            <button class="btn btn-danger" type="button" id="reset">${UI.icon('refresh')} Сбросить данные</button>
          </div>
        </section>
      </div>`);

    // сохранение ФИО и группы
    content.querySelector('#profile-form').addEventListener('submit', event => {
      event.preventDefault();
      const name = content.querySelector('#p-name').value.trim().replace(/\s+/g, ' ');
      if (name.split(' ').length < 2) {
        content.querySelector('#profile-error').textContent = 'Введите фамилию и имя.';
        return;
      }
      const patch = { name };
      const group = content.querySelector('#p-group');
      if (group) patch.group = group.value;
      Db.updateUser(user.id, patch);
      UI.toast('Данные сохранены');
      ProfilePage.render();
    });

    // смена пароля
    content.querySelector('#password-form').addEventListener('submit', event => {
      event.preventDefault();
      const error = content.querySelector('#password-error');
      const oldPass = content.querySelector('#old-pass').value;
      const newPass = content.querySelector('#new-pass').value;
      if (oldPass !== user.password) return void (error.textContent = 'Текущий пароль указан неверно.');
      if (newPass.length < 4) return void (error.textContent = 'Новый пароль — не меньше 4 символов.');
      Db.updateUser(user.id, { password: newPass });
      UI.toast('Пароль изменён');
      ProfilePage.render();
    });

    content.querySelectorAll('[data-theme]').forEach(button => {
      button.addEventListener('click', () => {
        Theme.apply(button.dataset.theme);
        ProfilePage.render();
      });
    });

    content.querySelector('#reset').addEventListener('click', async () => {
      const ok = await UI.confirm({
        title: 'Сбросить данные?',
        text: 'Будут удалены все изменения, добавленные пользователи и загруженные файлы. Вы вернётесь на страницу входа.',
        okText: 'Сбросить',
        danger: true,
      });
      if (!ok) return;
      await FileStore.clear();
      Db.reset();
      Auth.logout();
      Router.go('/login');
    });
  },
};
