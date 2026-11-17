// Вход, выход и регистрация.
// Важно: это учебный прототип без сервера, пароли хранятся в браузере открытым текстом.
// В настоящем приложении проверка пароля должна выполняться на сервере.

const Auth = {
  current() {
    try {
      const id = localStorage.getItem(CONFIG.sessionKey);
      return id ? Db.getUser(id) : null;
    } catch (error) {
      return null;
    }
  },

  login(email, password) {
    const user = Db.getUserByEmail(email);
    if (!user || user.password !== password) return null;
    try {
      localStorage.setItem(CONFIG.sessionKey, user.id);
    } catch (error) {
      console.warn('Не удалось запомнить вход', error);
    }
    return user;
  },

  logout() {
    try {
      localStorage.removeItem(CONFIG.sessionKey);
    } catch (error) {
      console.warn(error);
    }
  },

  // Регистрируются только студенты; преподавателей добавляет администратор
  register({ name, email, group, password }) {
    if (Db.getUserByEmail(email)) {
      return { error: 'Пользователь с такой почтой уже зарегистрирован.' };
    }
    const user = Db.addUser({
      id: Utils.uid('u'),
      role: 'student',
      name, email: email.trim(), group, password,
    });
    return { user };
  },

  isTeacher(user = Auth.current()) {
    return Boolean(user) && user.role === 'teacher';
  },
};
