import React, { useState } from 'react';

const MAX_SCREENSHOTS = 5;

const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function InputForm({ onSave }) {
  const [formData, setFormData] = useState({
    date: getLocalDateTimeString(),
    pair: '',
    strategy: 'scalping',
    direction: 'buy',
    profit: '',
    reflection: '',
    environment: '',
    screenshots: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files);
    const current = formData.screenshots.length;
    const selected = files.length;
    if (current + selected > MAX_SCREENSHOTS) {
      window.alert(`スクショは5枚までです。現在 ${current} 枚です。`);
      e.target.value = '';
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, event.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 連打防止：既に保存中なら何もしない
    if (isSaving) return;

    // バリデーション（必須項目チェック）
    if (
      !formData.pair ||
      !formData.strategy ||
      !formData.direction ||
      formData.profit === '' ||
      formData.profit === null ||
      formData.profit === undefined
    ) {
      window.alert('必須項目を入力してください（振替・手法・買売・利益/損失）');
      return;
    }

    setIsSaving(true);

    try {
      // onSave 呼び出し（同期・非同期どちらにも対応）
      await Promise.resolve(
        onSave({
          ...formData,
          id: Date.now(),
          profit: parseInt(formData.profit)
        })
      );

      // フォームクリア
      setFormData({
        date: getLocalDateTimeString(),
        pair: '',
        strategy: 'scalping',
        direction: 'buy',
        profit: '',
        reflection: '',
        environment: '',
        screenshots: []
      });

      // 成功時のみトースト表示
      setShowToast(true);
    } catch (err) {
      console.error('保存エラー:', err);
      window.alert(
        '保存に失敗しました。\n\n' +
        'エラー種別: ' + (err && err.name ? err.name : '不明') + '\n' +
        'エラー内容: ' + (err && err.message ? err.message : '不明') + '\n\n' +
        'この内容を開発者にお伝えください。'
      );
    } finally {
      setTimeout(() => {
        setShowToast(false);
        setIsSaving(false);
      }, 2000);
    }
  };

  // スクショ枚数表示の色・併記メッセージ分岐
  const screenshotCount = formData.screenshots.length;
  let counterColor = '#9e9e9e';
  let counterSuffix = '';
  if (screenshotCount === 0) {
    counterColor = '#9e9e9e';
  } else if (screenshotCount >= 1 && screenshotCount <= 3) {
    counterColor = '#4caf50';
  } else if (screenshotCount === 4) {
    counterColor = '#ff9800';
    counterSuffix = '（残り1枚）';
  } else if (screenshotCount >= 5) {
    counterColor = '#f44336';
    counterSuffix = '⚠️ 上限到達';
  }
  const isMaxReached = screenshotCount >= MAX_SCREENSHOTS;

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4caf50',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10000
        }}>
          ✅ 保存しました
        </div>
      )}
      <h2>📝 トレード入力</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>📅 日時</label>
          <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>

        <div>
          <label>🔄 振替（ペア）</label>
          <input type="text" name="pair" placeholder="EUR/USD" value={formData.pair} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} required />
        </div>

        <div>
          <label>📊 手法</label>
          <select name="strategy" value={formData.strategy} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="scalping">スキャルピング</option>
            <option value="day_trade">デイトレード</option>
            <option value="swing">スウィング</option>
          </select>
        </div>

        <div>
          <label>💹 ポジション</label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label><input type="radio" name="direction" value="buy" checked={formData.direction === 'buy'} onChange={handleChange} /> 買い</label>
            <label><input type="radio" name="direction" value="sell" checked={formData.direction === 'sell'} onChange={handleChange} /> 売り</label>
          </div>
        </div>

        <div>
          <label>💰 利益/損失</label>
          <input type="number" name="profit" placeholder="125000" value={formData.profit} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} required />
        </div>

        <div>
          <label>📝 反省点</label>
          <textarea name="reflection" placeholder="改善点や気づき..." value={formData.reflection} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px', fontFamily: 'inherit' }} />
        </div>

        <div>
          <label>🌍 環境認識</label>
          <textarea name="environment" placeholder="相場状況..." value={formData.environment} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px', fontFamily: 'inherit' }} />
        </div>

        <div>
          <label>📸 スクショ</label>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            display: 'block',
            color: counterColor
          }}>
            📎 スクショ：{screenshotCount} / 5 枚{counterSuffix && ` ${counterSuffix}`}
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleScreenshotChange}
            disabled={isMaxReached}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              opacity: isMaxReached ? 0.6 : 1,
              cursor: isMaxReached ? 'not-allowed' : 'pointer'
            }}
          />
          {formData.screenshots.length > 0 && (
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {formData.screenshots.map((screenshot, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img src={screenshot} alt={`Screenshot ${index}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                  <button type="button" onClick={() => removeScreenshot(index)} style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(231, 76, 60, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: '12px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isSaving ? 0.6 : 1
          }}
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}
