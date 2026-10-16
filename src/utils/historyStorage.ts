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
const MAX_HISTORY_ITEMS = 10;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
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
 * Salva um criativo gerado no IndexedDB mantendo no máximo os 10 mais recentes.
 * Executa de forma 100% assíncrona sem bloquear a renderização ou interface.
 */
export async function saveCreativeToHistory(result: Produtos2ResultState): Promise<void> {
  try {
    if (!result || !result.productName) return;

    const db = await openDB();
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

    // 1. Inserir o novo item
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 2. Podar excedentes para manter estritamente os últimos 10 itens
    const allItems = await getCreativesHistory();
    if (allItems.length > MAX_HISTORY_ITEMS) {
      const itemsToDelete = allItems.slice(MAX_HISTORY_ITEMS);
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const oldItem of itemsToDelete) {
        store.delete(oldItem.id);
      }
    }
  } catch (err) {
    console.warn('Aviso: Falha ao salvar criativo no histórico local:', err);
  }
}

/**
 * Retorna os últimos criativos ordenados do mais recente para o mais antigo.
 */
export async function getCreativesHistory(): Promise<HistoryCreativeItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const req = index.openCursor(null, 'prev'); // Ordenação decrescente (mais recente primeiro)
      const list: HistoryCreativeItem[] = [];

      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor && list.length < MAX_HISTORY_ITEMS) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };

      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Aviso: Falha ao ler histórico de criativos:', err);
    return [];
  }
}

/**
 * Remove um item específico do histórico.
 */
export async function deleteCreativeFromHistory(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Aviso ao deletar item do histórico:', err);
  }
}

/**
 * Limpa todo o histórico de criativos.
 */
export async function clearAllCreativesHistory(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Aviso ao limpar histórico:', err);
  }
}
