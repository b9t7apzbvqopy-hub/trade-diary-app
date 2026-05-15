import { useMemo } from 'react';

const calc = (filtered) => {
  if (filtered.length === 0) return { profit: 0, winRate: 0, count: 0 };
  const profit = filtered.reduce((s, t) => s + (Number(t.profit) || 0), 0);
  const wins = filtered.filter(t => (Number(t.profit) || 0) > 0).length;
  const winRate = Math.round((wins / filtered.length) * 100);
  return { profit, winRate, count: filtered.length };
};

const computeStats = (trades) => {
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

  // 今年の開始（1月1日 00:00:00）
  const yearStart = new Date(todayStart);
  yearStart.setMonth(0, 1);

  // 既存：「今日」: todayStart <= t.date < tomorrowStart
  const todayTrades = trades.filter(t => {
    const d = new Date(t.date);
    return d >= todayStart && d < tomorrowStart;
  });

  // 既存：「今週」: weekStart <= t.date
  const weekTrades = trades.filter(t => new Date(t.date) >= weekStart);

  // 既存：「今月」: monthStart <= t.date
  const monthTrades = trades.filter(t => new Date(t.date) >= monthStart);

  // 追加：「今年」: yearStart <= t.date
  const yearTrades = trades.filter(t => new Date(t.date) >= yearStart);

  // 年別集計
  const yearlyMap = new Map();
  trades.forEach(t => {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return;
    const y = d.getFullYear();
    if (!yearlyMap.has(y)) yearlyMap.set(y, []);
    yearlyMap.get(y).push(t);
  });
  const yearlyHistory = [...yearlyMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, ts]) => {
      const s = calc(ts);
      return { year, count: s.count, totalProfit: s.profit, winRate: s.winRate };
    });

  // 月別集計（直近24ヶ月）
  const monthlyMap = new Map();
  trades.forEach(t => {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, { year: y, month: m, list: [] });
    monthlyMap.get(key).list.push(t);
  });
  const monthlyHistory = [...monthlyMap.values()]
    .sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month))
    .slice(0, 24)
    .map(({ year, month, list }) => {
      const s = calc(list);
      return { year, month, count: s.count, totalProfit: s.profit, winRate: s.winRate };
    });

  // 振替別集計（通算）
  const pairMap = new Map();
  trades.forEach(t => {
    const p = t.pair;
    if (p === undefined || p === null || p === '') return;
    if (!pairMap.has(p)) pairMap.set(p, []);
    pairMap.get(p).push(t);
  });
  const pairHistory = [...pairMap.entries()]
    .map(([pair, ts]) => {
      const s = calc(ts);
      return { pair, count: s.count, totalProfit: s.profit, winRate: s.winRate };
    })
    .sort((a, b) => b.totalProfit - a.totalProfit);

  return {
    today: calc(todayTrades),
    week: calc(weekTrades),
    month: calc(monthTrades),
    thisYear: calc(yearTrades),
    allTime: calc(trades),
    yearlyHistory,
    monthlyHistory,
    pairHistory,
  };
};

export const useStatistics = (trades) => {
  return useMemo(() => computeStats(Array.isArray(trades) ? trades : []), [trades]);
};
