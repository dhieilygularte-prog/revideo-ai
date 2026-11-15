import { Produtos2ResultState } from '../produtos2/types';

export interface HistoryCreativeItem {
  id: string;
  timestamp: number;
  dateFormatted: string;
  productName: string;
  niche: string;
  duration: number;
  storyboardImageUrl?: string;
  finalCopy: string;
  veoPrompt: string;
  description?: string;
  hashtags?: string[];
  result: Produtos2ResultState;
}

const DB_NAME = 'aurora_revideo_history_db';
const STORE_NAME = 'creatives_history';
const DB_VERSION = 1;
export const MAX_HISTORY_ITEMS = 30;

function openIndexedDB(dbName: string, storeName: string, version = 1): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Grava um registro no IndexedDB e poda excedentes mantendo apenas os `maxItems` mais recentes por `timestamp`.
 */
export async function putAndPruneIndexedDBItem<T extends { id: string; timestamp: number }>(
  dbName: string,
  storeName: string,
  item: T,
  maxItems = MAX_HISTORY_ITEMS,
  version = 1
): Promise<void> {
  const db = await openIndexedDB(dbName, storeName, version);
  const safeItem = {
    ...item,
    timestamp: Number(item.timestamp) || Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(safeItem);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  await new Promise<void>((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const index = store.index('timestamp');
    const req = index.openKeyCursor(null, 'prev');
    let count = 0;

    req.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (!cursor) return;
      count += 1;
      if (count > maxItems) {
        store.delete(cursor.primaryKey);
      }
      cursor.continue();
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    req.onerror = () => resolve();
  });
}

/**
 * Lista até `maxItems` registros do IndexedDB ordenados do mais recente ao mais antigo.
 */
export async function listIndexedDBItems<T>(
  dbName: string,
  storeName: string,
  maxItems = MAX_HISTORY_ITEMS,
  version = 1
): Promise<T[]> {
  try {
    const db = await openIndexedDB(dbName, storeName, version);
    return await new Promise<T[]>((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index('timestamp');
      const req = index.openCursor(null, 'prev');
      const list: T[] = [];

      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor && list.length < maxItems) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };

      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Remove um registro específico de um store IndexedDB pelo `id`.
 */
export async function deleteIndexedDBItem(
  dbName: string,
  storeName: string,
  id: string,
  version = 1
): Promise<void> {
  const db = await openIndexedDB(dbName, storeName, version);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Limpa todos os registros de um store IndexedDB.
 */
export async function clearIndexedDBStore(
  dbName: string,
  storeName: string,
  version = 1
): Promise<void> {
  const db = await openIndexedDB(dbName, storeName, version);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} às ${hours}:${minutes}`;
}

/**
 * Salva um criativo gerado no IndexedDB mantendo no máximo os 30 mais recentes.
 * Executa de forma 100% assíncrona sem bloquear a renderização ou interface.
 */
export async function saveCreativeToHistory(result: Produtos2ResultState): Promise<void> {
  try {
    if (!result || !result.productName) return;

    const now = new Date();
    const item: HistoryCreativeItem = {
      id: `creative_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.getTime(),
      dateFormatted: formatDate(now),
      productName: result.productName || 'Produto',
      niche: result.detectedNiche || 'Geral',
      duration: result.duration || 10,
      storyboardImageUrl: result.storyboardImageUrl,
      finalCopy: result.finalCopy || '',
      veoPrompt: result.veoPrompt || '',
      description: result.description,
      hashtags: result.hashtags,
      result,
    };

    await putAndPruneIndexedDBItem(DB_NAME, STORE_NAME, item, MAX_HISTORY_ITEMS, DB_VERSION);
  } catch (err) {
    console.warn('Aviso: Falha ao salvar criativo no histórico local:', err);
  }
}

/**
 * Retorna os últimos criativos ordenados do mais recente para o mais antigo.
 */
export async function getCreativesHistory(): Promise<HistoryCreativeItem[]> {
  return listIndexedDBItems<HistoryCreativeItem>(DB_NAME, STORE_NAME, MAX_HISTORY_ITEMS, DB_VERSION);
}

/**
 * Remove um item específico do histórico.
 */
export async function deleteCreativeFromHistory(id: string): Promise<void> {
  try {
    await deleteIndexedDBItem(DB_NAME, STORE_NAME, id, DB_VERSION);
  } catch (err) {
    console.warn('Aviso ao deletar item do histórico:', err);
  }
}

/**
 * Limpa todo o histórico de criativos.
 */
export async function clearAllCreativesHistory(): Promise<void> {
  try {
    await clearIndexedDBStore(DB_NAME, STORE_NAME, DB_VERSION);
  } catch (err) {
    console.warn('Aviso ao limpar histórico:', err);
  }
}
