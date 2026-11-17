// Список курсов.

const CoursesPage = {
  render() {
    const user = Auth.current();
    const isTeacher = Auth.isTeacher(user);
    const courses = Db.coursesFor(user);

    const cards = courses.map(course => {
      const tasks = Db.tasksOfCourse(course.id);
      let info;

      if (isTeacher) {
        const taskIds = tasks.map(t => t.id);
        const waiting = Db.submissionsForTeacher(user)
          .filter(s => s.status === 'sent' && taskIds.includes(s.taskId)).length;
        info = `
          <div class="muted">Группа ${Utils.escape(course.groups.join(', '))}</div>
          <div class="row row-between"><span class="muted">Заданий: ${tasks.length}</span>
          <span class="chip ${waiting ? 'chip-warn' : 'chip-ok'}">${waiting ? 'на проверке: ' + waiting : 'всё проверено'}</span></div>`;
      } else {
        const progress = Tasks.courseProgress(course.id, user.id);
        info = `
          <div class="muted">Преподаватель: ${Utils.escape(Utils.shortName(Db.getUser(course.teacherId).name))}</div>
          <div>
            <div class="row row-between muted"><span>Сдано: ${progress.done} из ${progress.total}</span><span>${progress.percent}%</span></div>
            <div class="progress"><div class="progress__bar" style="width:${progress.percent}%"></div></div>
          </div>`;
      }

      return `
        <article class="card course-card">
          <div class="course-cover cover-${course.color % 4}">${Utils.escape(course.title)}</div>
          <div class="course-card__body">
            <div class="muted">${Utils.escape(course.description)}</div>
            ${info}
            <a class="btn btn-primary" href="#/course/${course.id}">Открыть курс</a>
          </div>
        </article>`;
    }).join('');

    const content = Layout.render('courses', `
      <div class="page-head">
        <div>
          <h1>Курсы</h1>
          <p class="muted">${courses.length} ${Utils.plural(courses.length, ['курс', 'курса', 'курсов'])}</p>
        </div>
        ${isTeacher ? `<button class="btn btn-primary" type="button" id="new-course">${UI.icon('plus')} Создать курс</button>` : ''}
      </div>
      ${courses.length ? `<div class="grid grid-3">${cards}</div>` : UI.empty('Курсов пока нет', 'book')}`);

    const addButton = content.querySelector('#new-course');
    if (addButton) addButton.addEventListener('click', () => Forms.openCourse());
  },
};
