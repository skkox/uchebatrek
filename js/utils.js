// Небольшие вспомогательные функции: даты, форматирование, экранирование.

const Utils = {
  // Защита от вставки HTML: все пользовательские строки выводим через эту функцию
  escape(value) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, ch => map[ch]);
  },

  uid(prefix = 'id') {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  pad(n) {
    return String(n).padStart(2, '0');
  },

  // даты
  // Даты сдачи хранятся строкой вида 2026-11-15, время нужно только для отправки работ.

  toIsoDate(date) {
    return `${date.getFullYear()}-${Utils.pad(date.getMonth() + 1)}-${Utils.pad(date.getDate())}`;
  },

  today() {
    return Utils.toIsoDate(new Date());
  },

  parseDate(iso) {
    const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  addDays(iso, count) {
    const date = Utils.parseDate(iso);
    date.setDate(date.getDate() + count);
    return Utils.toIsoDate(date);
  },

  diffDays(fromIso, toIso) {
    return Math.round((Utils.parseDate(toIso) - Utils.parseDate(fromIso)) / 86400000);
  },

  formatDate(iso) {
    if (!iso) return '—';
    const d = Utils.parseDate(iso);
    return `${Utils.pad(d.getDate())}.${Utils.pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  },

  formatDateTime(isoDateTime) {
    const d = new Date(isoDateTime);
    return `${Utils.formatDate(Utils.toIsoDate(d))} ${Utils.pad(d.getHours())}:${Utils.pad(d.getMinutes())}`;
  },

  // Подпись под сроком сдачи: «осталось 3 дня», «просрочено на 2 дня»
  deadlineText(due) {
    const left = Utils.diffDays(Utils.today(), due);
    const days = n => `${n} ${Utils.plural(n, ['день', 'дня', 'дней'])}`;
    if (left === 0) return 'срок — сегодня';
    if (left > 0) return `осталось ${days(left)}`;
    return `просрочено на ${days(-left)}`;
  },

  plural(n, forms) {
    const mod100 = Math.abs(n) % 100;
    const mod10 = mod100 % 10;
    if (mod100 > 10 && mod100 < 20) return forms[2];
    if (mod10 > 1 && mod10 < 5) return forms[1];
    if (mod10 === 1) return forms[0];
    return forms[2];
  },

  // имена

  shortName(fullName) {
    const [last, first, middle] = fullName.split(' ');
    return [last, first ? first[0] + '.' : '', middle ? middle[0] + '.' : ''].join(' ').trim();
  },

  firstName(fullName) {
    const parts = fullName.split(' ');
    return parts[1] || parts[0];
  },

  initials(fullName) {
    const parts = fullName.split(' ').filter(Boolean);
    return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
  },

  // файлы и числа

  extension(fileName) {
    const dot = fileName.lastIndexOf('.');
    const ext = dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase();
    return ext === 'jpeg' ? 'jpg' : ext;
  },

  formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
    return Math.max(1, Math.round(bytes / 1024)) + ' КБ';
  },

  percent(score, max) {
    return Math.round((score / max) * 100);
  },

  average(numbers) {
    if (!numbers.length) return null;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  },

  formatScore(value) {
    return String(Math.round(value * 10) / 10).replace('.', ',');
  },

  // Скачивание файла из браузера
  saveBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // CSV для Excel: разделитель «;» и BOM, чтобы кириллица открывалась правильно
  saveCsv(rows, fileName) {
    const quote = cell => '"' + String(cell ?? '').replace(/"/g, '""') + '"';
    const text = '﻿' + rows.map(row => row.map(quote).join(';')).join('\r\n');
    Utils.saveBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), fileName);
  },
};
