export const saveTrade = (trade) => {
  const trades = JSON.parse(localStorage.getItem('trades') || '[]');
  trades.push(trade);
  localStorage.setItem('trades', JSON.stringify(trades));
};

export const getTrades = () => {
  return JSON.parse(localStorage.getItem('trades') || '[]');
};

export const deleteTrade = (id) => {
  const trades = JSON.parse(localStorage.getItem('trades') || '[]');
  const filtered = trades.filter(t => t.id !== id);
  localStorage.setItem('trades', JSON.stringify(filtered));
};
