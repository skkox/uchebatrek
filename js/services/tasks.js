// Логика вокруг заданий и работ студентов: статусы, прогресс, проверка файла.

const Tasks = {
  // Статус задания для студента: если работа есть — её статус,
  // иначе «К сдаче» или «Просрочено» в зависимости от срока.
  statusOf(task, userId) {
    const submission = Db.getSubmission(task.id, userId);
    if (submission) return submission.status;
    return Utils.today() > task.due ? 'late' : 'todo';
  },

  // Задания, по которым от студента ещё что-то требуется
  needsAction(status) {
    return status === 'todo' || status === 'late' || status === 'revision';
  },

  // Сдано заданий из общего числа (работа на доработке считается несданной)
  courseProgress(courseId, userId) {
    const tasks = Db.tasksOfCourse(courseId);
    const done = tasks.filter(task => {
      const status = Tasks.statusOf(task, userId);
      return status === 'sent' || status === 'checked';
    }).length;
    return { done, total: tasks.length, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  },

  // Средний результат студента в процентах от максимума (по проверенным работам)
  averagePercent(userId, courseId = null) {
    const values = Db.submissionsOfUser(userId)
      .filter(s => s.status === 'checked')
      .map(s => ({ s, task: Db.getTask(s.taskId) }))
      .filter(x => x.task && (!courseId || x.task.courseId === courseId))
      .map(x => Utils.percent(x.s.score, x.task.maxScore));
    const avg = Utils.average(values);
    return avg === null ? null : Math.round(avg);
  },

  // Проверка файла перед загрузкой. Возвращает текст ошибки или пустую строку.
  validateFile(file, task) {
    if (!file) return 'Выберите файл для загрузки.';
    const ext = Utils.extension(file.name);
    if (!task.formats.includes(ext)) {
      return `Формат «.${ext || 'без расширения'}» не подходит. Допустимо: ${task.formats.join(', ').toUpperCase()}.`;
    }
    if (file.size === 0) return 'Файл пустой.';
    if (file.size > CONFIG.maxFileSize) {
      return `Файл слишком большой (${Utils.formatSize(file.size)}). Максимум — ${Utils.formatSize(CONFIG.maxFileSize)}.`;
    }
    return '';
  },

  // Скачивание работы студента. У демонстрационных записей файла нет,
  // поэтому для них создаётся небольшой текстовый файл.
  async download(submission) {
    let blob = submission.fileId ? await FileStore.get(submission.fileId) : null;
    if (!blob) {
      blob = new Blob(
        [`Демонстрационный файл «${submission.fileName}».\nЭта запись создана вместе с учебными данными приложения.`],
        { type: 'text/plain;charset=utf-8' }
      );
    }
    Utils.saveBlob(blob, submission.fileName);
  },

  // Полное удаление работы: запись и сам файл
  async removeSubmission(submission) {
    if (submission.fileId) await FileStore.remove(submission.fileId);
    Db.deleteSubmission(submission.id);
  },

  acceptAttr(task) {
    const list = task.formats.map(f => '.' + f);
    if (task.formats.includes('jpg')) list.push('.jpeg');
    return list.join(',');
  },
};
