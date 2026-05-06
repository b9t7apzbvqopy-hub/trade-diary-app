export const useStatistics = (trades) => {
  const today = new Date().toDateString();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const monthStart = new Date();
  monthStart.setDate(1);

  const filterByDate = (tradeDate, startDate) => {
    return new Date(tradeDate).toDateString() >= startDate.toDateString();
  };

  const calculateStats = (filtered) => {
    if (filtered.length === 0) return { profit: 0, winRate: 0, count: 0 };
    const profit = filtered.reduce((sum, t) => sum + t.profit, 0);
    const wins = filtered.filter(t => t.profit > 0).length;
    const winRate = Math.round((wins / filtered.length) * 100);
    return { profit, winRate, count: filtered.length };
  };

  const todayTrades = trades.filter(t => new Date(t.date).toDateString() === today);
  const weekTrades = trades.filter(t => filterByDate(t.date, weekStart));
  const monthTrades = trades.filter(t => filterByDate(t.date, monthStart));

  return {
    today: calculateStats(todayTrades),
    week: calculateStats(weekTrades),
    month: calculateStats(monthTrades)
  };
};
