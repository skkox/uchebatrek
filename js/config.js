// Настройки приложения. Ключи и ограничения собраны в одном месте,
// чтобы их было легко поменять.

const CONFIG = {
  appName: 'УчебаТрек',

  // ключи localStorage
  storageKey: 'uchebatrek.data.v2',
  sessionKey: 'uchebatrek.session',
  themeKey: 'uchebatrek.theme',

  // ограничения для загружаемых работ
  maxFileSize: 5 * 1024 * 1024, // 5 МБ
  allFormats: ['pdf', 'docx', 'pptx', 'xlsx', 'zip', 'txt', 'png', 'jpg'],

  groups: ['9-ИС304', '9-ИС301', '9-ИС302'],
};

// Статусы работы студента: подпись и цвет плашки
const STATUS = {
  todo:     { label: 'К сдаче',      tone: 'info' },
  sent:     { label: 'На проверке',  tone: 'warn' },
  revision: { label: 'На доработке', tone: 'violet' },
  checked:  { label: 'Проверено',    tone: 'ok' },
  late:     { label: 'Просрочено',   tone: 'danger' },
};
