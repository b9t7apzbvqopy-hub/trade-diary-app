import React, { useState } from 'react';

export default function TradeList({ trades, onDelete }) {
  // 拡大表示用のスクショ URL（null なら非表示）
  const [zoomedImage, setZoomedImage] = useState(null);

  // 削除確認
  const handleDelete = (id) => {
    if (window.confirm('このトレードを削除します。よろしいですか？')) {
      onDelete(id);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2>📋 トレード一覧</h2>
      {trades.length === 0 ? (
        <p style={{ color: '#999' }}>トレードがまだありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {trades.slice().reverse().map(trade => (
            <div key={trade.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
              {/* ヘッダ行：日時・銘柄・手法・削除ボタン */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong>{new Date(trade.date).toLocaleString('ja-JP')}</strong>
                  <span style={{ marginLeft: '10px', color: '#666' }}>{trade.pair}</span>
                  <span style={{ marginLeft: '10px', backgroundColor: '#e3f2fd', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>{trade.strategy}</span>
                </div>
                <button onClick={() => handleDelete(trade.id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
              </div>

              {/* 損益行 */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ marginRight: '15px' }}>{trade.direction === 'buy' ? '買い' : '売り'}</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: trade.profit > 0 ? '#27ae60' : '#e74c3c' }}>
                  {trade.profit > 0 ? '+' : ''}{trade.profit.toLocaleString()}円
                </span>
              </div>

              {/* 環境認識 */}
              {trade.environment && (
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#fff', borderLeft: '3px solid #3498db', borderRadius: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3498db', marginBottom: '4px' }}>📊 環境認識</div>
                  <div style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{trade.environment}</div>
                </div>
              )}

              {/* 反省点 */}
              {trade.reflection && (
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#fff', borderLeft: '3px solid #f39c12', borderRadius: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f39c12', marginBottom: '4px' }}>💡 反省点</div>
                  <div style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{trade.reflection}</div>
                </div>
              )}

              {/* スクショ */}
              {trade.screenshots && trade.screenshots.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>📸 スクショ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {trade.screenshots.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`スクショ${idx + 1}`}
                        onClick={() => setZoomedImage(src)}
                        style={{
                          width: '120px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* スクショ拡大モーダル */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            padding: '20px'
          }}
        >
          <img
            src={zoomedImage}
            alt="拡大表示"
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
          />
        </div>
      )}
    </div>
  );
}
