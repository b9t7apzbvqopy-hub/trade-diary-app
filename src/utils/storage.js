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

// id 一致レコードを updatedTrade で置き換えて Drive に上書き保存。
// imageRefs は呼び出し側で更新前のものをそのまま渡す前提（画像ファイルは変更しない）。
export const updateTrade = async (token, updatedTrade) => {
  const { trades } = await getTradesJson(token);
  const index = trades.findIndex(t => t.id === updatedTrade.id);
  if (index === -1) {
    throw new Error('更新対象のトレードが見つかりませんでした');
  }
  trades[index] = updatedTrade;
  await saveTradesJson(token, trades);
  return true;
};

export const overwriteAllTrades = async (token, trades) => {
  await saveTradesJson(token, Array.isArray(trades) ? trades : []);
};

export const resetAll = async (token) => {
  await saveTradesJson(token, []);
  await deleteAllImages(token);
};
