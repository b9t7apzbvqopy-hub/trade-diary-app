import React, { useState, useEffect, useRef } from 'react';
import { downloadImageBlob } from '../utils/drive.js';

export default function TradeList({ token, trades, loading, onDelete, onEdit }) {
  // 拡大表示用のスクショ URL（null なら非表示）
  const [zoomedImage, setZoomedImage] = useState(null);

  // ファイル名 → blob URL のマップ
  const [imageUrls, setImageUrls] = useState({});
  const urlsRef = useRef({});

  // trades 変更時に画像を一括取得（並列）
  useEffect(() => {
    if (!token || !Array.isArray(trades)) return;
    let cancelled = false;
    const allRefs = new Set();
    trades.forEach(t => {
      if (Array.isArray(t.imageRefs)) t.imageRefs.forEach(n => allRefs.add(n));
    });
    const missing = [...allRefs].filter(n => !urlsRef.current[n]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (name) => {
        try {
          const blob = await downloadImageBlob(token, name);
          if (!blob) return [name, null];
          const url = URL.createObjectURL(blob);
          return [name, url];
        } catch (e) {
          console.warn('画像取得失敗:', name, e);
          return [name, null];
        }
      })
    ).then((pairs) => {
      if (cancelled) {
        pairs.forEach(([, url]) => { if (url) URL.revokeObjectURL(url); });
        return;
      }
      const additions = {};
      pairs.forEach(([name, url]) => { if (url) additions[name] = url; });
      urlsRef.current = { ...urlsRef.current, ...additions };
      setImageUrls(prev => ({ ...prev, ...additions }));
    });

    return () => { cancelled = true; };
  }, [token, trades]);

  // unmount で全 blob URL を revoke
  useEffect(() => {
    return () => {
      Object.values(urlsRef.current).forEach(url => {
        try { URL.revokeObjectURL(url); } catch { /* noop */ }
      });
      urlsRef.current = {};
    };
  }, []);

  // 削除確認
  const handleDelete = (id) => {
    if (window.confirm('このトレードを削除します。よろしいですか？')) {
      onDelete(id);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2>📋 トレード一覧</h2>
      {loading ? (
        <p style={{ color: '#999' }}>読み込み中...</p>
      ) : trades.length === 0 ? (
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
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => onEdit && onEdit(trade)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>修正</button>
                  <button onClick={() => handleDelete(trade.id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
                </div>
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

              {/* スクショ（Drive から取得） */}
              {Array.isArray(trade.imageRefs) && trade.imageRefs.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>📸 スクショ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {trade.imageRefs.map((name, idx) => {
                      const url = imageUrls[name];
                      return (
                        <div
                          key={idx}
                          style={{
                            width: '120px',
                            height: '90px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: '#eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            cursor: url ? 'pointer' : 'default',
                            color: '#999',
                            fontSize: '11px',
                          }}
                          onClick={() => { if (url) setZoomedImage(url); }}
                        >
                          {url ? (
                            <img
                              src={url}
                              alt={`スクショ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            '読み込み中...'
                          )}
                        </div>
                      );
                    })}
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
