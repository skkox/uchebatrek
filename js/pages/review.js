// Проверка работ (преподаватель): оценка, комментарий, возврат на доработку.

const ReviewPage = {
  render(query) {
    const user = Auth.current();
    if (!Auth.isTeacher(user)) return Router.go('/home');

    // По ссылке «Проверить» открываем работы конкретного задания, иначе — все ожидающие проверки
    const taskId = query.get('task') || '';
    let filters = { course: '', status: taskId ? '' : 'sent', task: taskId, query: '' };
    const courses = Db.coursesFor(user);

    const content = Layout.render('review', `
      <div class="page-head">
        <div>
          <h1>Проверка работ</h1>
          <p class="muted" id="review-count"></p>
        </div>
      </div>

      <div class="toolbar">
        <input class="input" id="f-query" type="search" placeholder="Поиск по студенту или заданию" aria-label="Поиск" value="${Utils.escape(filters.query)}">
        <select class="select" id="f-course" aria-label="Курс">
          <option value="">Все курсы</option>
          ${courses.map(c => `<option value="${c.id}" ${filters.course === c.id ? 'selected' : ''}>${Utils.escape(c.title)}</option>`).join('')}
        </select>
        <select class="select" id="f-status" aria-label="Статус">
          <option value="">Все статусы</option>
          <option value="sent" ${filters.status === 'sent' ? 'selected' : ''}>Ожидают проверки</option>
          <option value="revision" ${filters.status === 'revision' ? 'selected' : ''}>На доработке</option>
          <option value="checked" ${filters.status === 'checked' ? 'selected' : ''}>Проверенные</option>
        </select>
      </div>
      <div id="review-table"></div>`);

    const table = content.querySelector('#review-table');

    const drawTable = () => {
      const list = ReviewPage.visible(user, filters);
      content.querySelector('#review-count').textContent =
        `Найдено работ: ${list.length}`;

      if (!list.length) {
        table.innerHTML = `<div class="card">${UI.empty('Работ с такими условиями нет', 'check')}</div>`;
        return;
      }

      table.innerHTML = `
        <div class="table-wrap is-stacked">
          <table class="table stacked">
            <thead><tr><th>Студент</th><th>Работа</th><th>Оценка и комментарий</th><th>Действия</th></tr></thead>
            <tbody>${list.map(ReviewPage.rowHtml).join('')}</tbody>
          </table>
        </div>`;
    };

    const onFilter = () => {
      filters = {
        course: content.querySelector('#f-course').value,
        status: content.querySelector('#f-status').value,
        task: '',
        query: content.querySelector('#f-query').value.trim().toLowerCase(),
      };
      drawTable();
    };
    content.querySelector('#f-query').addEventListener('input', onFilter);
    content.querySelector('#f-course').addEventListener('change', onFilter);
    content.querySelector('#f-status').addEventListener('change', onFilter);

    // кнопки в строках таблицы (делегирование событий)
    table.addEventListener('click', event => {
      const button = event.target.closest('[data-act]');
      if (!button) return;
      const row = button.closest('tr');
      const submission = Db.getSubmissionById(row.dataset.id);

      if (button.dataset.act === 'download') return Tasks.download(submission);
      ReviewPage.save(row, submission, button.dataset.act, drawTable);
    });

    drawTable();
  },

  // Работы, подходящие под выбранные фильтры (сначала ожидающие проверки)
  visible(user, f) {
    const order = { sent: 0, revision: 1, checked: 2 };

    return Db.submissionsForTeacher(user)
      .filter(s => {
        const task = Db.getTask(s.taskId);
        const student = Db.getUser(s.userId);
        const text = (student.name + ' ' + task.title).toLowerCase();
        return (!f.course || task.courseId === f.course)
          && (!f.status || s.status === f.status)
          && (!f.task || s.taskId === f.task)
          && (!f.query || text.includes(f.query));
      })
      .sort((a, b) => order[a.status] - order[b.status] || a.submittedAt.localeCompare(b.submittedAt));
  },

  rowHtml(s) {
    const task = Db.getTask(s.taskId);
    const course = Db.getCourse(task.courseId);
    const student = Db.getUser(s.userId);

    return `
      <tr data-id="${s.id}">
        <td data-label="Студент">
          <div class="row">${UI.avatar(student.name)}
            <div><div class="nowrap">${Utils.escape(Utils.shortName(student.name))}</div><div class="muted">${Utils.escape(student.group)}</div></div>
          </div>
        </td>
        <td data-label="Работа" class="review-work">
          <div><strong>${Utils.escape(task.title)}</strong></div>
          <div class="muted">${Utils.escape(course.title)} · ${Utils.formatDateTime(s.submittedAt)}</div>
          <div class="review-chips">${UI.chip(s.status)}${s.late ? ' <span class="chip chip-muted">с опозданием</span>' : ''}</div>
          <button class="btn btn-secondary btn-sm" type="button" data-act="download">${UI.icon('download', 16)} ${Utils.escape(s.fileName)} · ${Utils.formatSize(s.fileSize)}</button>
          ${s.comment ? `<div class="muted">Комментарий студента: «${Utils.escape(s.comment)}»</div>` : ''}
        </td>
        <td data-label="Оценка" class="review-cell">
          <div class="row" style="margin-bottom:8px">
            <input class="input input-sm score-input" name="score" inputmode="decimal" value="${s.score ?? ''}" aria-label="Оценка, максимум ${task.maxScore}">
            <span>из ${task.maxScore}</span>
          </div>
          <input class="input input-sm" name="feedback" placeholder="Комментарий студенту" value="${Utils.escape(s.feedback)}" aria-label="Комментарий студенту">
        </td>
        <td data-label="Действия">
          <div class="review-actions">
            <button class="btn btn-primary btn-sm" type="button" data-act="accept">${s.status === 'checked' ? 'Обновить оценку' : 'Принять'}</button>
            <button class="btn btn-secondary btn-sm" type="button" data-act="revision">На доработку</button>
          </div>
        </td>
      </tr>`;
  },

  // Сохранение оценки или возврат на доработку
  save(row, submission, action, redraw) {
    const task = Db.getTask(submission.taskId);
    const feedback = row.querySelector('[name="feedback"]').value.trim();

    if (action === 'accept') {
      const score = parseFloat(row.querySelector('[name="score"]').value.replace(',', '.'));
      if (Number.isNaN(score) || score < 0 || score > task.maxScore) {
        UI.toast(`Введите оценку от 0 до ${task.maxScore}`, 'error');
        return;
      }
      submission.status = 'checked';
      submission.score = score;
      submission.checkedAt = new Date().toISOString();
      Db.notify(submission.userId,
        `Работа «${task.title}» проверена: ${Utils.formatScore(score)} из ${task.maxScore}`,
        '/task/' + task.id);
      UI.toast('Оценка сохранена');
    } else {
      if (!feedback) {
        UI.toast('Напишите, что нужно исправить', 'error');
        return;
      }
      submission.status = 'revision';
      submission.score = null;
      submission.checkedAt = null;
      Db.notify(submission.userId, `Работа «${task.title}» возвращена на доработку`, '/task/' + task.id);
      UI.toast('Работа возвращена на доработку');
    }

    submission.feedback = feedback;
    Db.saveSubmission(submission);
    redraw();
    Layout.updatePendingBadge();
  },
};
