// Демонстрационные данные для первого запуска.
// Все даты считаются от сегодняшнего дня, поэтому в приложении
// всегда есть и просроченные, и ближайшие задания.

function createSeed() {
  const today = Utils.today();
  const day = offset => Utils.addDays(today, offset);

  // момент отправки: «offset» дней назад/вперёд в 12:00
  const moment = (offset, hour = 12) => {
    const date = Utils.parseDate(day(offset));
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };

  const users = [
    { id: 'u-student', role: 'student', name: 'Бастрыгина Виктория Антоновна', email: 'student@demo.ru', password: '1234', group: '9-ИС304' },
    { id: 'u-student-2', role: 'student', name: 'Воронин Марк Сергеевич', email: 'mark@demo.ru', password: '1234', group: '9-ИС304' },
    { id: 'u-student-3', role: 'student', name: 'Белова Анна Дмитриевна', email: 'anna@demo.ru', password: '1234', group: '9-ИС304' },
    { id: 'u-teacher', role: 'teacher', name: 'Орлова Елена Петровна', email: 'teacher@demo.ru', password: '1234', group: '' },
  ];

  const courses = [
    { id: 'c1', title: 'Веб-дизайн', description: 'Макеты, UI-кит, адаптивная верстка', teacherId: 'u-teacher', groups: ['9-ИС304'], color: 0 },
    { id: 'c2', title: 'Базы данных', description: 'Проектирование БД и язык SQL', teacherId: 'u-teacher', groups: ['9-ИС304'], color: 1 },
    { id: 'c3', title: 'Алгоритмизация', description: 'Алгоритмы и структуры данных', teacherId: 'u-teacher', groups: ['9-ИС304'], color: 2 },
    { id: 'c4', title: 'Английский для IT', description: 'Техническая документация и терминология', teacherId: 'u-teacher', groups: ['9-ИС304'], color: 3 },
  ];

  const task = (id, courseId, title, due, maxScore, formats, description) =>
    ({ id, courseId, title, due: day(due), maxScore, formats, allowLate: true, description });

  const tasks = [
    task('t1', 'c1', 'Макет главной страницы', -5, 10, ['pdf', 'png', 'jpg'],
      'Подготовьте макет главной страницы учебного приложения для ПК и смартфона. Покажите шапку, меню и основные блоки.'),
    task('t2', 'c1', 'Адаптивная верстка лендинга', 3, 15, ['zip'],
      'Сверстайте страницу по макету. Загрузите архив ZIP с файлами HTML, CSS и изображениями. Страница должна корректно открываться на экранах 360, 768 и 1280 px.'),
    task('t3', 'c1', 'UI-кит проекта', 10, 10, ['pdf', 'png', 'zip'],
      'Опишите цвета, шрифты, кнопки, поля ввода и карточки вашего проекта. Приложите страницу с описанием компонентов.'),
    task('t4', 'c2', 'ER-диаграмма учебной БД', 1, 10, ['pdf', 'png', 'jpg'],
      'Постройте ER-диаграмму для предметной области «Библиотека»: не менее пяти сущностей, связи и ключи.'),
    task('t5', 'c2', 'Набор SQL-запросов', 9, 20, ['txt', 'docx', 'pdf'],
      'Составьте 10 запросов SELECT: с соединением таблиц, группировкой и сортировкой. К каждому запросу напишите короткий комментарий.'),
    task('t6', 'c2', 'Нормализация таблиц', -12, 10, ['docx', 'pdf'],
      'Приведите предложенную таблицу к третьей нормальной форме. Опишите каждый шаг.'),
    task('t7', 'c3', 'Блок-схема алгоритма сортировки', -9, 10, ['pdf', 'png', 'jpg'],
      'Опишите алгоритм пузырьковой сортировки блок-схемой по ГОСТ.'),
    task('t8', 'c3', 'Реализация бинарного поиска', 5, 15, ['zip', 'txt'],
      'Реализуйте бинарный поиск и приложите файл с кодом и несколькими тестовыми примерами.'),
    task('t9', 'c4', 'Перевод технической статьи', -2, 10, ['docx', 'pdf', 'txt'],
      'Переведите фрагмент технической документации (одна страница) и выпишите десять новых терминов.'),
    task('t10', 'c4', 'Глоссарий IT-терминов', 12, 10, ['xlsx', 'docx', 'pdf'],
      'Составьте глоссарий из 30 терминов по теме «Базы данных»: термин, перевод, определение.'),
  ];

  // Сданные работы. Файлов у демонстрационных записей нет (demo: true),
  // при скачивании создаётся небольшой текстовый файл.
  const sub = (id, taskId, userId, fileName, size, sentOffset, status, score, feedback, comment = '') => ({
    id, taskId, userId, fileId: null, demo: true,
    fileName, fileSize: size, comment,
    submittedAt: moment(sentOffset),
    status, score, feedback,
    checkedAt: status === 'sent' ? null : moment(sentOffset + 1, 15),
    late: false,
    attempts: 1,
  });

  const submissions = [
    sub('s1', 't1', 'u-student', 'maket_glavnoy.pdf', 842000, -7, 'checked', 9, 'Хорошая сетка и цвета. Добавьте состояния кнопок при наведении.', 'Макет для ПК и мобильной версии.'),
    sub('s2', 't7', 'u-student', 'sortirovka.png', 310000, -10, 'checked', 8, 'Алгоритм верный, не хватает условия выхода из цикла.'),
    sub('s3', 't6', 'u-student', 'normalizaciya.docx', 128000, -13, 'checked', 10, 'Отлично, все шаги описаны.'),
    sub('s4', 't4', 'u-student', 'er_biblioteka.pdf', 560000, -1, 'sent', null, '', 'Шесть сущностей, связи «многие ко многим» вынесены в отдельные таблицы.'),
    sub('s5', 't8', 'u-student', 'binary_search.zip', 24000, -2, 'revision', null, 'Добавьте обработку пустого массива и два теста для элемента, которого нет в списке.', 'Код на Python.'),
    sub('s6', 't1', 'u-student-2', 'main_mark.pdf', 720000, -6, 'checked', 8, 'Нужно больше контраста у текста на кнопках.'),
    sub('s7', 't4', 'u-student-2', 'er_mark.png', 410000, 0, 'sent', null, ''),
    sub('s8', 't4', 'u-student-3', 'er_anna.pdf', 450000, 0, 'sent', null, '', 'Добавила связи и ключи.'),
    sub('s9', 't2', 'u-student-3', 'landing_anna.zip', 1900000, 0, 'sent', null, ''),
  ];

  const notifications = [
    { id: 'n1', userId: 'u-student', text: 'Работа «Макет главной страницы» проверена: 9 из 10', link: '/task/t1', createdAt: moment(-6, 15), read: true },
    { id: 'n2', userId: 'u-student', text: 'Работа «Реализация бинарного поиска» возвращена на доработку', link: '/task/t8', createdAt: moment(-1, 10), read: false },
    { id: 'n3', userId: 'u-student', text: 'Опубликовано новое задание «Глоссарий IT-терминов»', link: '/task/t10', createdAt: moment(-1, 9), read: false },
    { id: 'n4', userId: 'u-teacher', text: 'Воронин М. С. сдал работу «ER-диаграмма учебной БД»', link: '/review?task=t4', createdAt: moment(0, 9), read: false },
    { id: 'n5', userId: 'u-teacher', text: 'Белова А. Д. сдала работу «Адаптивная верстка лендинга»', link: '/review?task=t2', createdAt: moment(0, 10), read: false },
  ];

  return { version: 2, users, courses, tasks, submissions, notifications };
}
