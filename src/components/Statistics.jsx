import React from 'react';
import { useStatistics } from '../hooks/useStatistics.js';

export default function Statistics({ trades }) {
  const stats = useStatistics(trades);

  const StatBox = ({ title, profit, winRate, count }) => (
    <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd' }}>
      <h3 style={{ marginBottom: '10px' }}>{title}</h3>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: profit > 0 ? '#27ae60' : '#e74c3c', marginBottom: '5px' }}>
        {profit > 0 ? '+' : ''}{profit.toLocaleString()}円
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        勝率: {winRate}% / {count}回
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2>📊 集計結果</h2>
      <StatBox title="☀️ 今日の成績" profit={stats.today.profit} winRate={stats.today.winRate} count={stats.today.count} />
      <StatBox title="📅 今週の成績" profit={stats.week.profit} winRate={stats.week.winRate} count={stats.week.count} />
      <StatBox title="📆 今月の成績" profit={stats.month.profit} winRate={stats.month.winRate} count={stats.month.count} />
    </div>
  );
}
