// Работа с данными. Всё хранится в localStorage браузера (сервера в проекте нет),
// сами файлы работ лежат отдельно в IndexedDB (см. fileStore.js).

const Db = (() => {
  let state = load();
  save();

  function load() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.users)) return data;
      }
    } catch (error) {
      console.warn('Не удалось прочитать сохранённые данные', error);
    }
    return createSeed();
  }

  function save() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Не удалось сохранить данные', error);
    }
  }

  const byId = (list, id) => list.find(item => item.id === id) || null;

  return {
    // служебное
    reset() {
      state = createSeed();
      save();
    },

    // пользователи
    getUser: id => byId(state.users, id),

    getUserByEmail(email) {
      const value = email.trim().toLowerCase();
      return state.users.find(user => user.email.toLowerCase() === value) || null;
    },

    // студенты указанных групп (без аргумента — все студенты)
    getStudents(groups) {
      return state.users.filter(user => user.role === 'student' && (!groups || groups.includes(user.group)));
    },

    addUser(user) {
      state.users.push(user);
      save();
      return user;
    },

    updateUser(id, patch) {
      Object.assign(byId(state.users, id), patch);
      save();
    },

    // курсы
    getCourse: id => byId(state.courses, id),

    // преподаватель видит свои курсы, студент — курсы своей группы
    coursesFor(user) {
      if (user.role === 'teacher') return state.courses.filter(c => c.teacherId === user.id);
      return state.courses.filter(c => c.groups.includes(user.group));
    },

    addCourse(course) {
      state.courses.push(course);
      save();
      return course;
    },

    // задания
    getTask: id => byId(state.tasks, id),

    tasksOfCourse: courseId => state.tasks.filter(t => t.courseId === courseId),

    tasksFor(user) {
      const ids = Db.coursesFor(user).map(c => c.id);
      return state.tasks.filter(t => ids.includes(t.courseId));
    },

    addTask(task) {
      state.tasks.push(task);
      save();
      return task;
    },

    updateTask(id, patch) {
      Object.assign(byId(state.tasks, id), patch);
      save();
    },

    // Удаляет задание вместе с работами; возвращает работы, чтобы убрать их файлы
    deleteTask(id) {
      const removed = state.submissions.filter(s => s.taskId === id);
      state.tasks = state.tasks.filter(t => t.id !== id);
      state.submissions = state.submissions.filter(s => s.taskId !== id);
      save();
      return removed;
    },

    // работы студентов
    getSubmissionById: id => byId(state.submissions, id),

    getSubmission(taskId, userId) {
      return state.submissions.find(s => s.taskId === taskId && s.userId === userId) || null;
    },

    submissionsOfTask: taskId => state.submissions.filter(s => s.taskId === taskId),

    submissionsOfUser: userId => state.submissions.filter(s => s.userId === userId),

    // все работы по курсам преподавателя
    submissionsForTeacher(teacher) {
      const taskIds = Db.tasksFor(teacher).map(t => t.id);
      return state.submissions.filter(s => taskIds.includes(s.taskId));
    },

    // добавляет работу или заменяет существующую с тем же id
    saveSubmission(submission) {
      const index = state.submissions.findIndex(s => s.id === submission.id);
      if (index >= 0) state.submissions[index] = submission;
      else state.submissions.push(submission);
      save();
    },

    deleteSubmission(id) {
      state.submissions = state.submissions.filter(s => s.id !== id);
      save();
    },

    // уведомления
    notify(userId, text, link) {
      state.notifications.push({
        id: Utils.uid('n'), userId, text, link,
        createdAt: new Date().toISOString(), read: false,
      });
      save();
    },

    notificationsOf(userId) {
      return state.notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    markRead(id) {
      const note = byId(state.notifications, id);
      if (note) note.read = true;
      save();
    },

    markAllRead(userId) {
      state.notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; });
      save();
    },
  };
})();
