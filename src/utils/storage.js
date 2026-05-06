// localStorage の trades キーから配列を安全に読み出す
const readTrades = () => {
  let raw = null;
  try {
    raw = localStorage.getItem('trades');
  } catch (e) {
    console.warn('localStorage.getItem 失敗:', e);
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('既存 trades の JSON.parse に失敗。空配列で再開します。', e);
    return [];
  }
};

// localStorage に trades 配列を書き込む。失敗時は判別可能な Error を再throw
const writeTrades = (trades) => {
  let json;
  try {
    json = JSON.stringify(trades);
  } catch (e) {
    throw new Error('データのシリアライズに失敗しました: ' + (e && e.message ? e.message : '不明'));
  }
  try {
    localStorage.setItem('trades', json);
  } catch (e) {
    const name = e && e.name ? e.name : '不明';
    if (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      (e && e.code === 22)
    ) {
      throw new Error(
        '容量上限に達しました。スクショを減らすか、設定タブから古いデータを削除してください。(' + name + ')'
      );
    }
    if (name === 'SecurityError') {
      throw new Error(
        'ブラウザのプライバシー設定により localStorage が利用できません。プライベートブラウズを解除してください。(' + name + ')'
      );
    }
    throw new Error(
      'localStorage への保存に失敗しました: ' + (e && e.message ? e.message : name)
    );
  }
};

export const saveTrade = (trade) => {
  const trades = readTrades();
  trades.push(trade);
  writeTrades(trades);
};

export const getTrades = () => {
  return readTrades();
};

export const deleteTrade = (id) => {
  const trades = readTrades();
  const filtered = trades.filter(t => t.id !== id);
  writeTrades(filtered);
};
