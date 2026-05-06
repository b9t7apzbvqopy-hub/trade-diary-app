import React, { useState } from 'react';

export default function Settings({ backgroundColor, onColorChange, onExport, onImport, onReset }) {
  const [importInput, setImportInput] = useState('');

  const presetColors = [
    { name: '白', value: '#ffffff' },
    { name: 'グレー', value: '#f0f0f0' },
    { name: 'ブルー', value: '#e3f2fd' },
    { name: 'グリーン', value: '#e8f5e9' },
    { name: 'ピンク', value: '#fce4ec' }
  ];

  const handleImport = () => {
    if (importInput.trim()) {
      try {
        const data = JSON.parse(importInput);
        onImport(data);
        setImportInput('');
        alert('インポート完了しました');
      } catch (e) {
        alert('無効な JSON です');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('すべてのトレード履歴を削除してもよろしいですか？')) {
      onReset();
      alert('リセット完了しました');
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2>⚙️ 設定</h2>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>🎨 背景色をカスタマイズ</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {presetColors.map(color => (
            <button
              key={color.value}
              title={color.name}
              onClick={() => onColorChange(color.value)}
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: color.value,
                border: backgroundColor === color.value ? '3px solid #3498db' : '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>💾 バックアップ</h3>
        <button onClick={onExport} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '15px' }}>
          JSON をダウンロード
        </button>
      </div>

      <div style={{ marginBottom: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>📥 復元</h3>
        <textarea
          value={importInput}
          onChange={(e) => setImportInput(e.target.value)}
          placeholder="JSON データを貼り付けてください"
          style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '12px', marginBottom: '10px' }}
        />
        <button onClick={handleImport} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          インポート
        </button>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>🔄 リセット</h3>
        <button onClick={handleReset} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          すべてのトレード履歴を削除
        </button>
      </div>
    </div>
  );
}
