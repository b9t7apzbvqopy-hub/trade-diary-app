import React, { useState } from 'react';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.pair && formData.profit) {
      onSave({
        ...formData,
        id: Date.now(),
        profit: parseInt(formData.profit)
      });
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
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
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
          <input type="file" multiple accept="image/*" onChange={handleScreenshotChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
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

        <button type="submit" style={{ padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
      </form>
    </div>
  );
}
