// Страница курса: список заданий с поиском, фильтром и сортировкой.

const CoursePage = {
  render(params) {
    const user = Auth.current();
    const course = Db.getCourse(params.id);
    if (!course) return Router.go('/courses');

    const isTeacher = Auth.isTeacher(user);
    const tasks = Db.tasksOfCourse(course.id);
    const teacher = Db.getUser(course.teacherId);

    const statusFilter = isTeacher ? '' : `
      <select class="select" id="filter-status" aria-label="Фильтр по статусу">
        <option value="">Все статусы</option>
        ${Object.entries(STATUS).map(([key, s]) => `<option value="${key}">${s.label}</option>`).join('')}
      </select>`;

    const content = Layout.render('courses', `
      <div class="crumbs"><a href="#/courses">Курсы</a> / ${Utils.escape(course.title)}</div>

      <div class="course-head cover-${course.color % 4}">
        <div>
          <h1>${Utils.escape(course.title)}</h1>
          <p>${Utils.escape(course.description)} · ${Utils.escape(Utils.shortName(teacher.name))}</p>
        </div>
      </div>

      <div class="toolbar">
        <input class="input" id="search" type="search" placeholder="Поиск по названию" aria-label="Поиск задания">
        ${statusFilter}
        <select class="select" id="sort" aria-label="Сортировка">
          <option value="due">По сроку сдачи</option>
          <option value="title">По названию</option>
        </select>
        ${isTeacher ? `<button class="btn btn-primary" type="button" id="add-task">${UI.icon('plus')} Добавить задание</button>` : ''}
      </div>

      <section class="card"><ul class="list" id="task-list"></ul></section>`);

    const list = content.querySelector('#task-list');
    const search = content.querySelector('#search');
    const sort = content.querySelector('#sort');
    const filter = content.querySelector('#filter-status');

    // Строка задания: у студента — статус, у преподавателя — сколько работ сдано
    const rowHtml = task => {
      let right;
      if (isTeacher) {
        const students = Db.getStudents(course.groups).length;
        const handed = Db.submissionsOfTask(task.id).length;
        right = `<span class="chip chip-muted">сдано ${handed} из ${students}</span>`;
      } else {
        right = UI.chip(Tasks.statusOf(task, user.id));
      }
      return `
        <li class="list__item">
          <div>
            <a class="list__title" href="#/task/${task.id}">${Utils.escape(task.title)}</a>
            <div class="muted">Срок: ${Utils.formatDate(task.due)} (${Utils.deadlineText(task.due)}) · максимум ${task.maxScore} баллов</div>
          </div>
          ${right}
        </li>`;
    };

    const draw = () => {
      const query = search.value.trim().toLowerCase();
      const status = filter ? filter.value : '';

      const rows = tasks
        .filter(task => task.title.toLowerCase().includes(query))
        .filter(task => !status || Tasks.statusOf(task, user.id) === status)
        .sort((a, b) => sort.value === 'title' ? a.title.localeCompare(b.title, 'ru') : a.due.localeCompare(b.due));

      list.innerHTML = rows.length
        ? rows.map(rowHtml).join('')
        : '<li>' + UI.empty('Заданий не найдено') + '</li>';
    };

    [search, sort, filter].filter(Boolean).forEach(el => el.addEventListener('input', draw));
    draw();

    const addButton = content.querySelector('#add-task');
    if (addButton) addButton.addEventListener('click', () => Forms.openTask({ courseId: course.id }));
  },
};
