import React from 'react';

export default function TradeList({ trades, onDelete }) {
  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2>📋 トレード一覧</h2>
      {trades.length === 0 ? (
        <p style={{ color: '#999' }}>トレードがまだありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {trades.slice().reverse().map(trade => (
            <div key={trade.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <strong>{new Date(trade.date).toLocaleString('ja-JP')}</strong>
                  <span style={{ marginLeft: '10px', color: '#666' }}>{trade.pair}</span>
                  <span style={{ marginLeft: '10px', backgroundColor: '#e3f2fd', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>{trade.strategy}</span>
                </div>
                <button onClick={() => onDelete(trade.id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ marginRight: '15px' }}>{trade.direction === 'buy' ? '買い' : '売り'}</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: trade.profit > 0 ? '#27ae60' : '#e74c3c' }}>
                  {trade.profit > 0 ? '+' : ''}{trade.profit.toLocaleString()}円
                </span>
              </div>
              {trade.environment && <p style={{ fontSize: '12px', color: '#666' }}>環境：{trade.environment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
