// Главная страница. У студента — сводка по заданиям, у преподавателя — по проверке.

const DashboardPage = {
  stat(value, label, icon, tone = '') {
    return `
      <div class="card stat">
        <span class="stat__icon ${tone ? 'stat__icon--' + tone : ''}">${UI.icon(icon, 24)}</span>
        <div>
          <div class="stat__value">${value}</div>
          <div class="stat__label">${label}</div>
        </div>
      </div>`;
  },

  render() {
    const user = Auth.current();
    const html = user.role === 'teacher' ? DashboardPage.teacher(user) : DashboardPage.student(user);
    Layout.render('home', html);
  },

  student(user) {
    const items = Db.tasksFor(user).map(task => ({ task, status: Tasks.statusOf(task, user.id) }));
    const toDo = items
      .filter(item => Tasks.needsAction(item.status))
      .sort((a, b) => a.task.due.localeCompare(b.task.due));
    const onReview = items.filter(item => item.status === 'sent').length;
    const average = Tasks.averagePercent(user.id);
    const nextDeadline = toDo.find(item => item.status !== 'late');

    const grades = Db.submissionsOfUser(user.id)
      .filter(s => s.status === 'checked')
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
      .slice(0, 4);

    const deadlineList = toDo.slice(0, 5).map(({ task, status }) => `
      <li class="list__item">
        <div>
          <a class="list__title" href="#/task/${task.id}">${Utils.escape(task.title)}</a>
          <div class="muted">${Utils.escape(Db.getCourse(task.courseId).title)} · до ${Utils.formatDate(task.due)} (${Utils.deadlineText(task.due)})</div>
        </div>
        ${UI.chip(status)}
      </li>`).join('');

    const gradeList = grades.map(s => {
      const task = Db.getTask(s.taskId);
      return `
        <li class="list__item">
          <div>
            <a class="list__title" href="#/task/${task.id}">${Utils.escape(task.title)}</a>
            <div class="muted">${Utils.escape(s.feedback)}</div>
          </div>
          <span class="score">${Utils.formatScore(s.score)}/${task.maxScore}</span>
        </li>`;
    }).join('');

    const courseList = Db.coursesFor(user).map(course => {
      const progress = Tasks.courseProgress(course.id, user.id);
      return `
        <li class="list__item">
          <div style="flex:1">
            <a class="list__title" href="#/course/${course.id}">${Utils.escape(course.title)}</a>
            <div class="progress" style="margin-top:6px"><div class="progress__bar" style="width:${progress.percent}%"></div></div>
          </div>
          <span class="muted nowrap">${progress.done} из ${progress.total}</span>
        </li>`;
    }).join('');

    return `
      <div class="page-head">
        <div>
          <h1>Здравствуйте, ${Utils.escape(Utils.firstName(user.name))}!</h1>
          <p class="muted">Группа ${Utils.escape(user.group)} · сегодня ${Utils.formatDate(Utils.today())}</p>
        </div>
      </div>

      <div class="grid grid-4">
        ${DashboardPage.stat(toDo.length, 'заданий требуют действий', 'upload', 'warn')}
        ${DashboardPage.stat(onReview, 'работ на проверке', 'clock', 'violet')}
        ${DashboardPage.stat(average === null ? '—' : average + '%', 'средний результат', 'chart')}
        ${DashboardPage.stat(nextDeadline ? Utils.formatDate(nextDeadline.task.due).slice(0, 5) : '—', 'ближайший срок', 'calendar', 'info')}
      </div>

      <div class="grid grid-main" style="margin-top:16px">
        <section class="card">
          <div class="card-title"><h3>Ближайшие сроки</h3><a href="#/calendar">Календарь</a></div>
          <ul class="list">${deadlineList || '<li>' + UI.empty('Все задания сданы', 'check') + '</li>'}</ul>
        </section>
        <section class="card">
          <div class="card-title"><h3>Последние оценки</h3><a href="#/grades">Все</a></div>
          <ul class="list">${gradeList || '<li>' + UI.empty('Оценок пока нет') + '</li>'}</ul>
        </section>
      </div>

      <section class="card" style="margin-top:16px">
        <div class="card-title"><h3>Прогресс по курсам</h3><a href="#/courses">Все курсы</a></div>
        <ul class="list">${courseList}</ul>
      </section>`;
  },

  teacher(user) {
    const submissions = Db.submissionsForTeacher(user);
    const pending = submissions.filter(s => s.status === 'sent').sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    const courses = Db.coursesFor(user);
    const students = Db.getStudents(courses.flatMap(c => c.groups));

    const pendingList = pending.slice(0, 6).map(s => {
      const task = Db.getTask(s.taskId);
      const student = Db.getUser(s.userId);
      return `
        <li class="list__item">
          <div>
            <span class="list__title">${Utils.escape(task.title)}</span>
            <div class="muted">${Utils.escape(Utils.shortName(student.name))} · ${Utils.formatDateTime(s.submittedAt)}</div>
          </div>
          <a class="btn btn-primary btn-sm" href="#/review?task=${task.id}">Проверить</a>
        </li>`;
    }).join('');

    const courseList = courses.map(course => {
      const tasks = Db.tasksOfCourse(course.id);
      const waiting = submissions.filter(s => s.status === 'sent' && tasks.some(t => t.id === s.taskId)).length;
      return `
        <li class="list__item">
          <div>
            <a class="list__title" href="#/course/${course.id}">${Utils.escape(course.title)}</a>
            <div class="muted">Группа ${Utils.escape(course.groups.join(', '))} · заданий: ${tasks.length}</div>
          </div>
          ${waiting ? `<span class="chip chip-warn">на проверке: ${waiting}</span>` : '<span class="chip chip-ok">всё проверено</span>'}
        </li>`;
    }).join('');

    return `
      <div class="page-head">
        <div>
          <h1>Здравствуйте, ${Utils.escape(Utils.firstName(user.name))}!</h1>
          <p class="muted">Сводка по вашим курсам на ${Utils.formatDate(Utils.today())}</p>
        </div>
      </div>

      <div class="grid grid-4">
        ${DashboardPage.stat(pending.length, 'работ ждут проверки', 'review', 'warn')}
        ${DashboardPage.stat(submissions.filter(s => s.status === 'checked').length, 'работ проверено', 'check')}
        ${DashboardPage.stat(Db.tasksFor(user).length, 'заданий опубликовано', 'book', 'info')}
        ${DashboardPage.stat(students.length, 'студентов в группах', 'user', 'violet')}
      </div>

      <div class="grid grid-main" style="margin-top:16px">
        <section class="card">
          <div class="card-title"><h3>Ожидают проверки</h3><a href="#/review">Все работы</a></div>
          <ul class="list">${pendingList || '<li>' + UI.empty('Новых работ нет', 'check') + '</li>'}</ul>
        </section>
        <section class="card">
          <div class="card-title"><h3>Мои курсы</h3><a href="#/courses">Открыть</a></div>
          <ul class="list">${courseList}</ul>
        </section>
      </div>`;
  },
};
