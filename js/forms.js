// Формы преподавателя в модальных окнах: создание курса и создание/редактирование задания.

const Forms = {
  openCourse() {
    const user = Auth.current();
    const groupOptions = CONFIG.groups.map(g => `<option>${g}</option>`).join('');

    const modal = UI.modal({
      title: 'Новый курс',
      body: `
        <form id="course-form" novalidate>
          <div class="field">
            <label for="course-title">Название курса</label>
            <input class="input" id="course-title" maxlength="60" required>
          </div>
          <div class="field">
            <label for="course-desc">Описание</label>
            <textarea class="textarea" id="course-desc" maxlength="160"></textarea>
          </div>
          <div class="field">
            <label for="course-group">Группа</label>
            <select class="select" id="course-group">${groupOptions}</select>
          </div>
          <p class="field-error" id="course-error" role="alert"></p>
          <div class="modal__actions">
            <button class="btn btn-secondary" type="button" data-close-form>Отмена</button>
            <button class="btn btn-primary" type="submit">Создать курс</button>
          </div>
        </form>`,
    });

    const form = modal.body.querySelector('#course-form');
    modal.body.querySelector('[data-close-form]').addEventListener('click', modal.close);

    form.addEventListener('submit', event => {
      event.preventDefault();
      const title = form.querySelector('#course-title').value.trim();
      if (title.length < 3) {
        form.querySelector('#course-error').textContent = 'Название должно содержать не меньше 3 символов.';
        return;
      }
      const count = Db.coursesFor(user).length;
      const course = Db.addCourse({
        id: Utils.uid('c'),
        title,
        description: form.querySelector('#course-desc').value.trim(),
        teacherId: user.id,
        groups: [form.querySelector('#course-group').value],
        color: count % 4,
      });
      modal.close();
      UI.toast('Курс создан');
      Router.go('/course/' + course.id);
    });
  },

  // Создание задания (task не передан) или редактирование существующего
  openTask({ courseId, task = null }) {
    const user = Auth.current();
    const isEdit = Boolean(task);
    const formats = task ? task.formats : ['pdf', 'docx', 'zip'];
    const due = task ? task.due : Utils.addDays(Utils.today(), 7);

    const checks = CONFIG.allFormats.map(f => `
      <label class="check">
        <input type="checkbox" name="format" value="${f}" ${formats.includes(f) ? 'checked' : ''}>
        ${f.toUpperCase()}
      </label>`).join('');

    const modal = UI.modal({
      title: isEdit ? 'Редактирование задания' : 'Новое задание',
      body: `
        <form id="task-form" novalidate>
          <div class="field">
            <label for="task-title">Название</label>
            <input class="input" id="task-title" maxlength="90" value="${Utils.escape(task ? task.title : '')}" required>
          </div>
          <div class="field">
            <label for="task-desc">Описание и требования</label>
            <textarea class="textarea" id="task-desc">${Utils.escape(task ? task.description : '')}</textarea>
          </div>
          <div class="grid grid-2">
            <div class="field">
              <label for="task-due">Срок сдачи</label>
              <input class="input" id="task-due" type="date" value="${due}" required>
            </div>
            <div class="field">
              <label for="task-max">Максимум баллов</label>
              <input class="input" id="task-max" type="number" min="1" max="100" value="${task ? task.maxScore : 10}" required>
            </div>
          </div>
          <div class="field">
            <span class="label">Допустимые форматы файлов</span>
            <div class="checks">${checks}</div>
          </div>
          <div class="field">
            <label class="check">
              <input type="checkbox" id="task-late" ${!task || task.allowLate ? 'checked' : ''}>
              Принимать работы после срока
            </label>
          </div>
          <p class="field-error" id="task-error" role="alert"></p>
          <div class="modal__actions">
            <button class="btn btn-secondary" type="button" data-close-form>Отмена</button>
            <button class="btn btn-primary" type="submit">${isEdit ? 'Сохранить' : 'Опубликовать'}</button>
          </div>
        </form>`,
    });

    const form = modal.body.querySelector('#task-form');
    const error = message => { form.querySelector('#task-error').textContent = message; };
    modal.body.querySelector('[data-close-form]').addEventListener('click', modal.close);

    form.addEventListener('submit', event => {
      event.preventDefault();

      const title = form.querySelector('#task-title').value.trim();
      const dueValue = form.querySelector('#task-due').value;
      const maxScore = Number(form.querySelector('#task-max').value);
      const chosen = [...form.querySelectorAll('[name="format"]:checked')].map(input => input.value);

      if (title.length < 3) return error('Название должно содержать не меньше 3 символов.');
      if (!dueValue) return error('Укажите срок сдачи.');
      if (!isEdit && dueValue < Utils.today()) return error('Срок сдачи не может быть в прошлом.');
      if (!Number.isFinite(maxScore) || maxScore < 1 || maxScore > 100) return error('Максимальный балл — число от 1 до 100.');
      if (!chosen.length) return error('Выберите хотя бы один формат файла.');

      const data = {
        title,
        description: form.querySelector('#task-desc').value.trim(),
        due: dueValue,
        maxScore,
        formats: chosen,
        allowLate: form.querySelector('#task-late').checked,
      };

      if (isEdit) {
        Db.updateTask(task.id, data);
        UI.toast('Изменения сохранены');
        modal.close();
        Router.refresh();
        return;
      }

      const created = Db.addTask({ id: Utils.uid('t'), courseId, ...data });
      const course = Db.getCourse(courseId);
      Db.getStudents(course.groups).forEach(student => {
        Db.notify(student.id, `Новое задание «${title}» по курсу «${course.title}»`, '/task/' + created.id);
      });
      modal.close();
      UI.toast('Задание опубликовано');
      Router.go('/task/' + created.id);
    });
  },
};
