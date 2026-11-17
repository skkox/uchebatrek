// Хранилище загруженных файлов. Работает поверх IndexedDB: в localStorage
// большие файлы не поместятся. Если IndexedDB недоступна (например, приватный режим),
// файлы временно хранятся в памяти до перезагрузки страницы.

const FileStore = (() => {
  const DB_NAME = 'uchebatrek-files';
  const STORE = 'files';
  const memory = new Map();
  let opening = null;

  function open() {
    if (!window.indexedDB) return Promise.resolve(null);
    if (!opening) {
      opening = new Promise(resolve => {
        try {
          const request = indexedDB.open(DB_NAME, 1);
          request.onupgradeneeded = () => request.result.createObjectStore(STORE);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        } catch (error) {
          resolve(null);
        }
      });
    }
    return opening;
  }

  // Выполняет одну операцию в транзакции и возвращает результат
  async function run(mode, action) {
    const db = await open();
    if (!db) return undefined;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    async put(id, blob) {
      memory.set(id, blob);
      await run('readwrite', store => store.put(blob, id));
    },

    async get(id) {
      const stored = await run('readonly', store => store.get(id));
      return stored || memory.get(id) || null;
    },

    async remove(id) {
      memory.delete(id);
      await run('readwrite', store => store.delete(id));
    },

    async clear() {
      memory.clear();
      await run('readwrite', store => store.clear());
    },
  };
})();
