// Оценки студента и журнал преподавателя.

const GradesPage = {
  render(query) {
    const user = Auth.current();
    if (Auth.isTeacher(user)) GradesPage.renderJournal(user, query);
    else GradesPage.renderStudent(user);
  },

  // студент

  renderStudent(user) {
    const submissions = Db.submissionsOfUser(user.id)
      .filter(s => Db.getTask(s.taskId))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    const checked = submissions.filter(s => s.status === 'checked');
    const average = Tasks.averagePercent(user.id);

    const courseRows = Db.coursesFor(user).map(course => {
      const graded = checked.filter(s => Db.getTask(s.taskId).courseId === course.id);
      const percent = Tasks.averagePercent(user.id, course.id);
      return `
        <tr>
          <td data-label="Курс">${Utils.escape(course.title)}</td>
          <td data-label="Проверено работ" class="num">${graded.length}</td>
          <td data-label="Средний результат">${percent === null ? '—' : `
            <div class="row"><div class="progress" style="width:120px"><div class="progress__bar" style="width:${percent}%"></div></div> ${percent}%</div>`}</td>
        </tr>`;
    }).join('');

    const rows = submissions.map(s => {
      const task = Db.getTask(s.taskId);
      return `
        <tr>
          <td data-label="Задание"><a href="#/task/${task.id}">${Utils.escape(task.title)}</a></td>
          <td data-label="Курс">${Utils.escape(Db.getCourse(task.courseId).title)}</td>
          <td data-label="Сдано">${Utils.formatDate(s.submittedAt)}</td>
          <td data-label="Статус">${UI.chip(s.status)}</td>
          <td data-label="Баллы" class="num">${s.status === 'checked' ? `<span class="score">${Utils.formatScore(s.score)} / ${task.maxScore}</span>` : '—'}</td>
        </tr>`;
    }).join('');

    const content = Layout.render('grades', `
      <div class="page-head">
        <div><h1>Оценки</h1><p class="muted">Результаты проверенных работ и статусы сданных заданий</p></div>
        <button class="btn btn-secondary" type="button" id="export">${UI.icon('download')} Скачать CSV</button>
      </div>

      <div class="grid grid-3">
        <div class="card stat"><span class="stat__icon">${UI.icon('chart', 24)}</span>
          <div><div class="stat__value">${average === null ? '—' : average + '%'}</div><div class="stat__label">средний результат</div></div></div>
        <div class="card stat"><span class="stat__icon stat__icon--info">${UI.icon('check', 24)}</span>
          <div><div class="stat__value">${checked.length}</div><div class="stat__label">работ проверено</div></div></div>
        <div class="card stat"><span class="stat__icon stat__icon--warn">${UI.icon('clock', 24)}</span>
          <div><div class="stat__value">${submissions.filter(s => s.status === 'sent').length}</div><div class="stat__label">на проверке</div></div></div>
      </div>

      <h2 style="margin-top:24px">По курсам</h2>
      <div class="table-wrap is-stacked">
        <table class="table stacked">
          <thead><tr><th>Курс</th><th class="num">Проверено работ</th><th>Средний результат</th></tr></thead>
          <tbody>${courseRows}</tbody>
        </table>
      </div>

      <h2 style="margin-top:24px">Все работы</h2>
      ${submissions.length ? `
        <div class="table-wrap is-stacked">
          <table class="table stacked">
            <thead><tr><th>Задание</th><th>Курс</th><th>Сдано</th><th>Статус</th><th class="num">Баллы</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>` : `<div class="card">${UI.empty('Вы ещё не сдавали работы')}</div>`}`);

    content.querySelector('#export').addEventListener('click', () => {
      const data = [['Курс', 'Задание', 'Дата сдачи', 'Статус', 'Баллы', 'Максимум', 'Комментарий преподавателя']];
      submissions.forEach(s => {
        const task = Db.getTask(s.taskId);
        data.push([
          Db.getCourse(task.courseId).title, task.title, Utils.formatDate(s.submittedAt),
          STATUS[s.status].label, s.status === 'checked' ? s.score : '', task.maxScore, s.feedback,
        ]);
      });
      Utils.saveCsv(data, 'оценки.csv');
    });
  },

  // преподаватель

  // Журнал: строки — студенты, столбцы — задания выбранного курса
  renderJournal(user, query) {
    const courses = Db.coursesFor(user);
    const course = Db.getCourse(query.get('course')) || courses[0];

    if (!course) {
      Layout.render('grades', `<h1>Журнал</h1><div class="card">${UI.empty('Сначала создайте курс', 'book')}</div>`);
      return;
    }

    const tasks = Db.tasksOfCourse(course.id).sort((a, b) => a.due.localeCompare(b.due));
    const students = Db.getStudents(course.groups);

    // содержимое одной ячейки журнала
    const cell = (student, task) => {
      const s = Db.getSubmission(task.id, student.id);
      if (!s) return Utils.today() > task.due ? '<span class="muted">не сдано</span>' : '—';
      if (s.status === 'checked') return `<span class="score">${Utils.formatScore(s.score)}</span>`;
      return `<span class="chip chip-${STATUS[s.status].tone}">${s.status === 'sent' ? 'сдано' : 'доработка'}</span>`;
    };

    const rows = students.map(student => {
      const percent = Tasks.averagePercent(student.id, course.id);
      return `
        <tr>
          <td>${Utils.escape(Utils.shortName(student.name))}</td>
          ${tasks.map(task => `<td class="num">${cell(student, task)}</td>`).join('')}
          <td class="num"><strong>${percent === null ? '—' : percent + '%'}</strong></td>
        </tr>`;
    }).join('');

    const content = Layout.render('grades', `
      <div class="page-head">
        <div><h1>Журнал</h1><p class="muted">Успеваемость группы ${Utils.escape(course.groups.join(', '))}</p></div>
        <button class="btn btn-secondary" type="button" id="export">${UI.icon('download')} Скачать CSV</button>
      </div>

      <div class="toolbar">
        <select class="select" id="course-select" aria-label="Курс">
          ${courses.map(c => `<option value="${c.id}" ${c.id === course.id ? 'selected' : ''}>${Utils.escape(c.title)}</option>`).join('')}
        </select>
      </div>

      ${tasks.length ? `
        <div class="table-wrap">
          <table class="table journal">
            <thead><tr>
              <th>Студент</th>
              ${tasks.map(t => `<th class="num" title="${Utils.escape(t.title)}"><a href="#/task/${t.id}">${Utils.escape(t.title.length > 16 ? t.title.slice(0, 15) + '…' : t.title)}</a><div class="muted">из ${t.maxScore}</div></th>`).join('')}
              <th class="num">Итого</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>` : `<div class="card">${UI.empty('В курсе пока нет заданий', 'book')}</div>`}`);

    content.querySelector('#course-select').addEventListener('change', event => {
      Router.go('/grades?course=' + event.target.value);
    });

    content.querySelector('#export').addEventListener('click', () => {
      const data = [['Студент', ...tasks.map(t => `${t.title} (из ${t.maxScore})`), 'Средний результат, %']];
      students.forEach(student => {
        data.push([
          student.name,
          ...tasks.map(task => {
            const s = Db.getSubmission(task.id, student.id);
            return s && s.status === 'checked' ? s.score : '';
          }),
          Tasks.averagePercent(student.id, course.id) ?? '',
        ]);
      });
      Utils.saveCsv(data, `журнал_${course.title}.csv`);
    });
  },
};
