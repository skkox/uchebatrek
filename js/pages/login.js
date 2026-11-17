// Страница входа и регистрации.

const LoginPage = {
  render(mode = 'login') {
    const demo = mode === 'login' ? `
      <div class="demo-box">
        <strong>Демонстрационный доступ</strong>
        <div class="muted">Пароль для всех учётных записей: 1234</div>
        <div class="row">
          <button class="btn btn-secondary btn-sm" type="button" data-demo="student@demo.ru">Войти как студент</button>
          <button class="btn btn-secondary btn-sm" type="button" data-demo="teacher@demo.ru">Войти как преподаватель</button>
        </div>
      </div>` : '';

    document.getElementById('root').innerHTML = `
      <div class="auth">
        <section class="auth__hero">
          <img src="assets/logo.svg" alt="" width="64" height="64">
          <div>
            <h1>УчебаТрек</h1>
            <p>Приложение для сопровождения обучения: курсы, задания, загрузка выполненных работ, оценки и сроки сдачи в одном месте.</p>
          </div>
          <ul class="auth__features">
            <li>${UI.icon('upload')} Загрузка работ одним файлом</li>
            <li>${UI.icon('review')} Понятные статусы проверки</li>
            <li>${UI.icon('chart')} Оценки и комментарии преподавателя</li>
            <li>${UI.icon('calendar')} Календарь сроков сдачи</li>
          </ul>
        </section>

        <section class="auth__panel">
          <div class="card auth__card" id="content" tabindex="-1">
            <div class="tabs" role="tablist">
              <button class="tab ${mode === 'login' ? 'is-active' : ''}" type="button" role="tab" data-mode="login" aria-selected="${mode === 'login'}">Вход</button>
              <button class="tab ${mode === 'register' ? 'is-active' : ''}" type="button" role="tab" data-mode="register" aria-selected="${mode === 'register'}">Регистрация</button>
            </div>
            ${mode === 'login' ? LoginPage.loginForm() : LoginPage.registerForm()}
            ${demo}
          </div>
        </section>
      </div>`;

    LoginPage.bind(mode);
  },

  loginForm() {
    return `
      <form id="auth-form" novalidate>
        <div class="field">
          <label for="email">Электронная почта</label>
          <input class="input" id="email" type="email" autocomplete="username" value="student@demo.ru">
        </div>
        <div class="field">
          <label for="password">Пароль</label>
          <input class="input" id="password" type="password" autocomplete="current-password" value="1234">
        </div>
        <p class="field-error" id="auth-error" role="alert"></p>
        <button class="btn btn-primary" type="submit" style="width:100%">Войти</button>
      </form>`;
  },

  registerForm() {
    const groups = CONFIG.groups.map(g => `<option>${g}</option>`).join('');
    return `
      <form id="auth-form" novalidate>
        <div class="field">
          <label for="name">ФИО</label>
          <input class="input" id="name" autocomplete="name" placeholder="Иванова Мария Сергеевна">
        </div>
        <div class="field">
          <label for="email">Электронная почта</label>
          <input class="input" id="email" type="email" autocomplete="username">
        </div>
        <div class="field">
          <label for="group">Группа</label>
          <select class="select" id="group">${groups}</select>
        </div>
        <div class="grid grid-2">
          <div class="field">
            <label for="password">Пароль</label>
            <input class="input" id="password" type="password" autocomplete="new-password">
          </div>
          <div class="field">
            <label for="password2">Повтор пароля</label>
            <input class="input" id="password2" type="password" autocomplete="new-password">
          </div>
        </div>
        <p class="field-error" id="auth-error" role="alert"></p>
        <button class="btn btn-primary" type="submit" style="width:100%">Зарегистрироваться</button>
      </form>`;
  },

  bind(mode) {
    const form = document.getElementById('auth-form');
    const showError = text => { document.getElementById('auth-error').textContent = text; };
    const value = id => form.querySelector('#' + id).value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    document.querySelectorAll('[data-mode]').forEach(tab => {
      tab.addEventListener('click', () => LoginPage.render(tab.dataset.mode));
    });

    document.querySelectorAll('[data-demo]').forEach(button => {
      button.addEventListener('click', () => {
        const user = Auth.login(button.dataset.demo, '1234');
        if (user) Router.go('/home');
      });
    });

    form.addEventListener('submit', event => {
      event.preventDefault();

      if (mode === 'login') {
        if (!value('email') || !form.querySelector('#password').value) return showError('Заполните оба поля.');
        const user = Auth.login(value('email'), form.querySelector('#password').value);
        if (!user) return showError('Неверная почта или пароль.');
        Router.go('/home');
        return;
      }

      // регистрация
      const name = value('name').replace(/\s+/g, ' ');
      const password = form.querySelector('#password').value;
      if (name.split(' ').length < 2) return showError('Введите фамилию и имя (отчество — по желанию).');
      if (!emailPattern.test(value('email'))) return showError('Введите корректный адрес почты.');
      if (password.length < 4) return showError('Пароль должен содержать не меньше 4 символов.');
      if (password !== form.querySelector('#password2').value) return showError('Пароли не совпадают.');

      const result = Auth.register({ name, email: value('email'), group: value('group'), password });
      if (result.error) return showError(result.error);
      Auth.login(result.user.email, password);
      UI.toast('Добро пожаловать в УчебаТрек!');
      Router.go('/home');
    });
  },
};
