export const useStatistics = (trades) => {
  // 今日の 00:00:00（ローカル時刻）
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 明日の 00:00:00（今日の上限）
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // 今週の開始（日曜日 00:00:00）
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // 今月の開始（1日 00:00:00）
  const monthStart = new Date(todayStart);
  monthStart.setDate(1);

  const calculateStats = (filtered) => {
    if (filtered.length === 0) return { profit: 0, winRate: 0, count: 0 };
    const profit = filtered.reduce((sum, t) => sum + t.profit, 0);
    const wins = filtered.filter(t => t.profit > 0).length;
    const winRate = Math.round((wins / filtered.length) * 100);
    return { profit, winRate, count: filtered.length };
  };

  // 「今日」: todayStart <= t.date < tomorrowStart
  const todayTrades = trades.filter(t => {
    const d = new Date(t.date);
    return d >= todayStart && d < tomorrowStart;
  });

  // 「今週」: weekStart <= t.date
  const weekTrades = trades.filter(t => new Date(t.date) >= weekStart);

  // 「今月」: monthStart <= t.date
  const monthTrades = trades.filter(t => new Date(t.date) >= monthStart);

  return {
    today: calculateStats(todayTrades),
    week: calculateStats(weekTrades),
    month: calculateStats(monthTrades)
  };
};
