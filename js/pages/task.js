// Страница задания. Студент загружает работу, преподаватель видит, кто что сдал.

const TaskPage = {
  render(params) {
    const user = Auth.current();
    const task = Db.getTask(params.id);
    if (!task) return Router.go('/courses');

    if (Auth.isTeacher(user)) TaskPage.renderTeacher(task, user);
    else TaskPage.renderStudent(task, user);
  },

  breadcrumbs(task, course) {
    return `
      <div class="crumbs">
        <a href="#/courses">Курсы</a> /
        <a href="#/course/${course.id}">${Utils.escape(course.title)}</a> /
        ${Utils.escape(task.title)}
      </div>`;
  },

  // Описание задания (одинаково для обеих ролей)
  descriptionCard(task, course, extraHead = '') {
    return `
      <section class="card">
        <div class="card-title">
          <h2 style="margin:0">${Utils.escape(task.title)}</h2>
          ${extraHead}
        </div>
        <p>${Utils.escape(task.description || 'Описание не добавлено.').replace(/\n/g, '<br>')}</p>
        <dl class="meta-list">
          <dt>Курс</dt><dd>${Utils.escape(course.title)}</dd>
          <dt>Срок сдачи</dt><dd>${Utils.formatDate(task.due)} · ${Utils.deadlineText(task.due)}</dd>
          <dt>Максимум</dt><dd>${task.maxScore} баллов</dd>
          <dt>Форматы</dt><dd>${task.formats.join(', ').toUpperCase()}, до ${Utils.formatSize(CONFIG.maxFileSize)}</dd>
          <dt>Сдача после срока</dt><dd>${task.allowLate ? 'принимается (с отметкой)' : 'не принимается'}</dd>
        </dl>
      </section>`;
  },

  // студент

  renderStudent(task, user) {
    const course = Db.getCourse(task.courseId);
    const status = Tasks.statusOf(task, user.id);

    // Состояние формы: выбранный файл и режим «заменить файл»
    const state = { file: null, replacing: false };

    const draw = () => {
      const content = Layout.render('courses', `
        ${TaskPage.breadcrumbs(task, course)}
        <div class="grid grid-main">
          ${TaskPage.descriptionCard(task, course, UI.chip(Tasks.statusOf(task, user.id)))}
          <section class="card" id="submission"></section>
        </div>`);
      drawSubmission(content.querySelector('#submission'));
    };

    // Правая карточка: зависит от того, сдана ли работа и проверена ли она
    const drawSubmission = box => {
      const submission = Db.getSubmission(task.id, user.id);
      const closed = !submission && Utils.today() > task.due && !task.allowLate;

      if (submission && submission.status === 'checked') {
        box.innerHTML = TaskPage.resultHtml(submission, task);
        TaskPage.bindDownload(box, submission);
        return;
      }

      if (closed) {
        box.innerHTML = `<h3>Сдача работы</h3>
          <div class="notice notice-warn">Срок сдачи истёк, приём работ после срока для этого задания отключён.</div>`;
        return;
      }

      if (submission && !state.replacing) {
        box.innerHTML = TaskPage.sentHtml(submission, task);
        TaskPage.bindDownload(box, submission);
        box.querySelector('[data-replace]').addEventListener('click', () => {
          state.replacing = true;
          drawSubmission(box);
        });
        box.querySelector('[data-withdraw]').addEventListener('click', async () => {
          const ok = await UI.confirm({
            title: 'Отозвать работу?',
            text: 'Файл будет удалён, и вы сможете загрузить работу заново.',
            okText: 'Отозвать',
            danger: true,
          });
          if (!ok) return;
          await Tasks.removeSubmission(submission);
          UI.toast('Работа отозвана');
          state.file = null;
          draw();
        });
        return;
      }

      box.innerHTML = TaskPage.uploadHtml(task, submission, state.replacing);
      TaskPage.bindUpload(box, task, user, state, draw, () => {
        state.replacing = false;
        drawSubmission(box);
      });
    };

    draw();
  },

  // Результат проверки
  resultHtml(submission, task) {
    return `
      <h3>Результат проверки</h3>
      <div class="result-box">
        <div class="result-box__score">${Utils.formatScore(submission.score)} / ${task.maxScore}</div>
        <div class="muted">${Utils.percent(submission.score, task.maxScore)}% · проверено ${Utils.formatDateTime(submission.checkedAt)}</div>
      </div>
      ${submission.feedback ? `<p style="margin-top:12px"><strong>Комментарий преподавателя</strong><br>${Utils.escape(submission.feedback)}</p>` : ''}
      <h3 style="margin-top:16px">Ваша работа</h3>
      ${TaskPage.fileCard(submission)}`;
  },

  // Работа отправлена и ждёт проверки (или возвращена на доработку)
  sentHtml(submission, task) {
    const revision = submission.status === 'revision';
    return `
      <div class="card-title"><h3>Ваша работа</h3>${UI.chip(submission.status)}</div>
      ${revision ? `
        <div class="notice notice-violet">
          <strong>Преподаватель вернул работу на доработку.</strong><br>
          ${Utils.escape(submission.feedback)}
        </div>` : '<div class="notice notice-info">Работа отправлена и ждёт проверки. Пока её не проверили, файл можно заменить.</div>'}
      ${TaskPage.fileCard(submission)}
      <p class="muted">
        Отправлено ${Utils.formatDateTime(submission.submittedAt)}${submission.late ? ' · <strong>с опозданием</strong>' : ''}
        · попытка ${submission.attempts}
      </p>
      ${submission.comment ? `<p><strong>Ваш комментарий:</strong> ${Utils.escape(submission.comment)}</p>` : ''}
      <div class="row">
        <button class="btn btn-primary" type="button" data-replace>${UI.icon('refresh')} ${revision ? 'Загрузить новую версию' : 'Заменить файл'}</button>
        <button class="btn btn-danger" type="button" data-withdraw>${UI.icon('trash')} Отозвать</button>
      </div>`;
  },

  fileCard(submission) {
    return `
      <div class="file-card">
        <span class="file-card__icon">${UI.icon('file', 28)}</span>
        <div class="file-card__body">
          <div class="file-card__name" title="${Utils.escape(submission.fileName)}">${Utils.escape(submission.fileName)}</div>
          <div class="muted">${Utils.formatSize(submission.fileSize)}</div>
        </div>
        <button class="btn btn-secondary btn-sm" type="button" data-download>${UI.icon('download', 16)} Скачать</button>
      </div>`;
  },

  bindDownload(box, submission) {
    const button = box.querySelector('[data-download]');
    if (button) button.addEventListener('click', () => Tasks.download(submission));
  },

  uploadHtml(task, previous, replacing) {
    const overdue = Utils.today() > task.due;
    const formats = task.formats.join(', ').toUpperCase();
    return `
      <h3>${replacing ? 'Новая версия работы' : 'Сдать работу'}</h3>
      ${overdue ? '<div class="notice notice-warn">Срок сдачи прошёл. Работа будет принята с отметкой «с опозданием».</div>' : ''}
      ${previous && previous.status === 'revision' ? '<div class="notice notice-violet">Исправьте замечания преподавателя и загрузите новую версию.</div>' : ''}
      <form id="upload-form" novalidate>
        <label class="dropzone" id="dropzone">
          <input class="sr-only" type="file" id="file-input" accept="${Tasks.acceptAttr(task)}">
          ${UI.icon('upload', 32)}
          <strong>Перетащите файл сюда</strong>
          <span>или нажмите, чтобы выбрать</span>
          <small>${formats} · до ${Utils.formatSize(CONFIG.maxFileSize)}</small>
        </label>
        <div id="chosen"></div>
        <p class="field-error" id="upload-error" role="alert"></p>
        <div class="field">
          <label for="comment">Комментарий преподавателю</label>
          <textarea class="textarea" id="comment" placeholder="Необязательно"></textarea>
        </div>
        <div class="row">
          <button class="btn btn-primary" type="submit" id="send-btn">Отправить на проверку</button>
          ${replacing ? '<button class="btn btn-secondary" type="button" id="cancel-btn">Отмена</button>' : ''}
        </div>
      </form>`;
  },

  // Обработчики формы загрузки
  bindUpload(box, task, user, state, redraw, cancel) {
    const form = box.querySelector('#upload-form');
    const input = box.querySelector('#file-input');
    const zone = box.querySelector('#dropzone');
    const chosen = box.querySelector('#chosen');
    const error = box.querySelector('#upload-error');

    // Показывает выбранный файл или сообщение, почему он не подходит
    const setFile = file => {
      const problem = Tasks.validateFile(file, task);
      error.textContent = problem;
      if (problem) {
        state.file = null;
        chosen.innerHTML = '';
        input.value = '';
        return;
      }
      state.file = file;
      chosen.innerHTML = `
        <div class="file-card">
          <span class="file-card__icon">${UI.icon('file', 28)}</span>
          <div class="file-card__body">
            <div class="file-card__name">${Utils.escape(file.name)}</div>
            <div class="muted">${Utils.formatSize(file.size)}</div>
          </div>
          <button class="icon-btn" type="button" id="remove-file" aria-label="Убрать файл">${UI.icon('x')}</button>
        </div>`;
      chosen.querySelector('#remove-file').addEventListener('click', () => {
        state.file = null;
        input.value = '';
        chosen.innerHTML = '';
      });
    };

    input.addEventListener('change', () => setFile(input.files[0] || null));

    // перетаскивание файла на область загрузки
    ['dragenter', 'dragover'].forEach(name => zone.addEventListener(name, event => {
      event.preventDefault();
      zone.classList.add('is-over');
    }));
    ['dragleave', 'drop'].forEach(name => zone.addEventListener(name, event => {
      event.preventDefault();
      zone.classList.remove('is-over');
    }));
    zone.addEventListener('drop', event => {
      const file = event.dataTransfer.files[0];
      if (file) setFile(file);
    });

    const cancelButton = box.querySelector('#cancel-btn');
    if (cancelButton) cancelButton.addEventListener('click', cancel);

    form.addEventListener('submit', async event => {
      event.preventDefault();

      const problem = Tasks.validateFile(state.file, task);
      if (problem) {
        error.textContent = problem;
        return;
      }

      const button = box.querySelector('#send-btn');
      button.disabled = true;

      const course = Db.getCourse(task.courseId);
      const old = Db.getSubmission(task.id, user.id);
      const fileId = Utils.uid('file');

      await FileStore.put(fileId, state.file);
      if (old && old.fileId) await FileStore.remove(old.fileId);

      Db.saveSubmission({
        id: old ? old.id : Utils.uid('s'),
        taskId: task.id,
        userId: user.id,
        fileId,
        fileName: state.file.name,
        fileSize: state.file.size,
        comment: box.querySelector('#comment').value.trim(),
        submittedAt: new Date().toISOString(),
        status: 'sent',
        score: null,
        feedback: '',
        checkedAt: null,
        late: Utils.today() > task.due,
        attempts: old ? old.attempts + 1 : 1,
      });

      Db.notify(course.teacherId, `${Utils.shortName(user.name)} сдал(а) работу «${task.title}»`, '/review?task=' + task.id);
      state.file = null;
      state.replacing = false;
      UI.toast('Работа отправлена на проверку');
      redraw();
    });
  },

  // преподаватель

  renderTeacher(task, user) {
    const course = Db.getCourse(task.courseId);
    const students = Db.getStudents(course.groups);

    const rows = students.map(student => {
      const submission = Db.getSubmission(task.id, student.id);
      const status = Tasks.statusOf(task, student.id);
      return `
        <tr>
          <td data-label="Студент"><div class="row">${UI.avatar(student.name)} ${Utils.escape(Utils.shortName(student.name))}</div></td>
          <td data-label="Статус">${UI.chip(status)}${submission && submission.late ? ' <span class="chip chip-muted">с опозданием</span>' : ''}</td>
          <td data-label="Сдано">${submission ? Utils.formatDateTime(submission.submittedAt) : '—'}</td>
          <td data-label="Файл">${submission
            ? `<button class="btn btn-secondary btn-sm" type="button" data-download="${submission.id}">${UI.icon('download', 16)} ${Utils.escape(submission.fileName)}</button>`
            : '—'}</td>
          <td data-label="Оценка" class="num">${submission && submission.status === 'checked' ? Utils.formatScore(submission.score) + ' / ' + task.maxScore : '—'}</td>
        </tr>`;
    }).join('');

    const content = Layout.render('courses', `
      ${TaskPage.breadcrumbs(task, course)}
      <div class="page-head">
        <div><h1>${Utils.escape(task.title)}</h1><p class="muted">Группа ${Utils.escape(course.groups.join(', '))}</p></div>
        <div class="row">
          <a class="btn btn-primary" href="#/review?task=${task.id}">${UI.icon('review')} К проверке</a>
          <button class="btn btn-secondary" type="button" id="edit-task">${UI.icon('edit')} Изменить</button>
          <button class="btn btn-danger" type="button" id="delete-task">${UI.icon('trash')} Удалить</button>
        </div>
      </div>

      <div class="stack">
        ${TaskPage.descriptionCard(task, course)}
        <div class="table-wrap is-stacked">
          <table class="table stacked">
            <thead><tr><th>Студент</th><th>Статус</th><th>Сдано</th><th>Файл</th><th class="num">Оценка</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">В группе пока нет студентов</td></tr>'}</tbody>
          </table>
        </div>
      </div>`);

    content.querySelectorAll('[data-download]').forEach(button => {
      button.addEventListener('click', () => Tasks.download(Db.getSubmissionById(button.dataset.download)));
    });

    content.querySelector('#edit-task').addEventListener('click', () => Forms.openTask({ courseId: course.id, task }));

    content.querySelector('#delete-task').addEventListener('click', async () => {
      const ok = await UI.confirm({
        title: 'Удалить задание?',
        text: 'Вместе с заданием будут удалены все сданные работы и загруженные файлы. Действие нельзя отменить.',
        okText: 'Удалить',
        danger: true,
      });
      if (!ok) return;
      const removed = Db.deleteTask(task.id);
      await Promise.all(removed.filter(s => s.fileId).map(s => FileStore.remove(s.fileId)));
      UI.toast('Задание удалено');
      Router.go('/course/' + course.id);
    });
  },
};
