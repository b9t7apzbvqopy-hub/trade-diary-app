import {
  getTradesJson,
  saveTradesJson,
  deleteImageByName,
  deleteAllImages,
} from './drive.js';

export const getTrades = async (token) => {
  const { trades } = await getTradesJson(token);
  return trades;
};

export const saveTrade = async (token, trade) => {
  const { trades } = await getTradesJson(token);
  trades.push(trade);
  await saveTradesJson(token, trades);
};

export const deleteTrade = async (token, id) => {
  const { trades } = await getTradesJson(token);
  const target = trades.find(t => t.id === id);
  const filtered = trades.filter(t => t.id !== id);
  await saveTradesJson(token, filtered);
  if (target && Array.isArray(target.imageRefs)) {
    for (const name of target.imageRefs) {
      try { await deleteImageByName(token, name); } catch (e) { console.warn('画像削除失敗:', name, e); }
    }
  }
};

export const overwriteAllTrades = async (token, trades) => {
  await saveTradesJson(token, Array.isArray(trades) ? trades : []);
};

export const resetAll = async (token) => {
  await saveTradesJson(token, []);
  await deleteAllImages(token);
};
