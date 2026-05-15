import React, { useState } from 'react';
import { useStatistics } from '../hooks/useStatistics.js';

const PERIODS = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '今週' },
  { value: 'month', label: '今月' },
  { value: 'thisYear', label: '今年' },
  { value: 'allTime', label: '通算' },
];

const PERIOD_TITLE = {
  today: '☀️ 今日の成績',
  week: '📅 今週の成績',
  month: '📆 今月の成績',
  thisYear: '🗓️ 今年の成績',
  allTime: '📊 通算の成績',
};

const formatProfit = (n) => {
  const v = Number(n) || 0;
  return (v > 0 ? '+' : '') + v.toLocaleString() + '円';
};

export default function Statistics({ trades }) {
  const stats = useStatistics(trades);
  const [period, setPeriod] = useState('month');

  const selected = stats[period] || { profit: 0, winRate: 0, count: 0 };

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

  const thStyle = {
    padding: '8px 10px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f7f9fc',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#555',
    whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '8px 10px',
    borderBottom: '1px solid #eee',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2>📊 集計結果</h2>

      {/* 期間切替プルダウン */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>
          表示期間
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ width: '100%', maxWidth: '240px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* 選択期間の集計 */}
      <StatBox
        title={PERIOD_TITLE[period]}
        profit={selected.profit}
        winRate={selected.winRate}
        count={selected.count}
      />

      {/* 年別履歴 */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>📅 年別履歴</h3>
        {stats.yearlyHistory.length === 0 ? (
          <p style={{ color: '#999', fontSize: '13px' }}>データがありません</p>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>年</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>損益</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>勝率</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>回数</th>
                </tr>
              </thead>
              <tbody>
                {stats.yearlyHistory.map(row => (
                  <tr key={row.year}>
                    <td style={tdStyle}>{row.year}年</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: row.totalProfit > 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                      {formatProfit(row.totalProfit)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{row.winRate}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 月別履歴（直近24ヶ月） */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>🗓️ 月別履歴（直近24ヶ月）</h3>
        {stats.monthlyHistory.length === 0 ? (
          <p style={{ color: '#999', fontSize: '13px' }}>データがありません</p>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>年月</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>損益</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>勝率</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>回数</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthlyHistory.map(row => (
                  <tr key={`${row.year}-${row.month}`}>
                    <td style={tdStyle}>{row.year}-{String(row.month).padStart(2, '0')}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: row.totalProfit > 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                      {formatProfit(row.totalProfit)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{row.winRate}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
