// Календарь сроков сдачи по месяцам.

const CalendarPage = {
  // показываемый месяц запоминается между переходами по страницам
  view: null,

  render() {
    const user = Auth.current();
    const isTeacher = Auth.isTeacher(user);

    if (!CalendarPage.view) {
      const now = new Date();
      CalendarPage.view = { year: now.getFullYear(), month: now.getMonth() };
    }
    const { year, month } = CalendarPage.view;

    const tasks = Db.tasksFor(user);
    const todayIso = Utils.today();

    // цвет задания в календаре: у студента по статусу, у преподавателя — по числу непроверенных работ
    const tone = task => {
      if (isTeacher) {
        const waiting = Db.submissionsOfTask(task.id).some(s => s.status === 'sent');
        return waiting ? 'warn' : 'info';
      }
      return STATUS[Tasks.statusOf(task, user.id)].tone;
    };

    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // неделя начинается с понедельника
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<div class="cal__day is-empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${Utils.pad(month + 1)}-${Utils.pad(day)}`;
      const events = tasks.filter(t => t.due === iso).map(t => `
        <a class="cal__event tone-${tone(t)}" href="#/task/${t.id}" title="${Utils.escape(t.title)}">${Utils.escape(t.title)}</a>`).join('');
      cells += `<div class="cal__day ${iso === todayIso ? 'is-today' : ''}"><span class="cal__num">${day}</span>${events}</div>`;
    }

    // список ближайших сроков справа
    const upcoming = tasks
      .filter(t => t.due >= todayIso && (isTeacher || Tasks.needsAction(Tasks.statusOf(t, user.id))))
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 8);

    const upcomingHtml = upcoming.map(t => `
      <li class="list__item">
        <div>
          <a class="list__title" href="#/task/${t.id}">${Utils.escape(t.title)}</a>
          <div class="muted">${Utils.escape(Db.getCourse(t.courseId).title)} · ${Utils.formatDate(t.due)}</div>
        </div>
        <span class="muted nowrap">${Utils.deadlineText(t.due)}</span>
      </li>`).join('');

    const rawName = first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(/ г\.$/, '');
    const monthName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const content = Layout.render('calendar', `
      <div class="page-head">
        <div><h1>Календарь</h1><p class="muted">Сроки сдачи заданий по месяцам</p></div>
      </div>

      <div class="grid grid-main">
        <section class="card">
          <div class="cal-head">
            <button class="btn btn-secondary btn-sm" type="button" data-shift="-1" aria-label="Предыдущий месяц">${UI.icon('left', 16)}</button>
            <h2>${monthName}</h2>
            <div class="row">
              <button class="btn btn-secondary btn-sm" type="button" data-shift="0">Сегодня</button>
              <button class="btn btn-secondary btn-sm" type="button" data-shift="1" aria-label="Следующий месяц">${UI.icon('right', 16)}</button>
            </div>
          </div>
          <div class="cal">
            ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => `<div class="cal__dow">${d}</div>`).join('')}
            ${cells}
          </div>
        </section>

        <section class="card">
          <div class="card-title"><h3>Ближайшие сроки</h3></div>
          <ul class="list">${upcomingHtml || '<li>' + UI.empty('Ближайших сроков нет', 'check') + '</li>'}</ul>
        </section>
      </div>`);

    content.querySelectorAll('[data-shift]').forEach(button => {
      button.addEventListener('click', () => {
        const shift = Number(button.dataset.shift);
        if (shift === 0) {
          const now = new Date();
          CalendarPage.view = { year: now.getFullYear(), month: now.getMonth() };
        } else {
          const next = new Date(year, month + shift, 1);
          CalendarPage.view = { year: next.getFullYear(), month: next.getMonth() };
        }
        CalendarPage.render();
      });
    });
  },
};
