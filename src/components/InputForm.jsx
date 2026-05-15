import React, { useState, useEffect, useRef } from 'react';
import { computeNextSeq, buildImageName, uploadImage, downloadImageBlob } from '../utils/drive.js';

const MAX_SCREENSHOTS = 4;

const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function InputForm({ token, onSave, editingTrade, onUpdate, onEditComplete }) {
  const isEditMode = !!editingTrade;
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
  const [toastMessage, setToastMessage] = useState('✅ 保存しました');

  // 編集モード時の既存画像（imageRefs → blob URL マップ）。読み取り専用表示用
  const [editImageUrls, setEditImageUrls] = useState({});
  const editUrlsRef = useRef({});

  // editingTrade が変わったら state を初期化
  useEffect(() => {
    if (editingTrade) {
      setFormData({
        date: editingTrade.date || getLocalDateTimeString(),
        pair: editingTrade.pair || '',
        strategy: editingTrade.strategy || 'scalping',
        direction: editingTrade.direction || 'buy',
        profit: editingTrade.profit !== undefined && editingTrade.profit !== null ? String(editingTrade.profit) : '',
        reflection: editingTrade.reflection || '',
        environment: editingTrade.environment || '',
        screenshots: [] // 編集モードでは新規アップロードしないので空
      });
    } else {
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
  }, [editingTrade]);

  // 編集モードに入ったら既存画像を Drive から取得して表示
  useEffect(() => {
    if (!editingTrade || !token) return;
    const refs = Array.isArray(editingTrade.imageRefs) ? editingTrade.imageRefs : [];
    if (refs.length === 0) return;
    let cancelled = false;
    const missing = refs.filter(n => !editUrlsRef.current[n]);
    if (missing.length === 0) return;
    Promise.all(missing.map(async (name) => {
      try {
        const blob = await downloadImageBlob(token, name);
        if (!blob) return [name, null];
        return [name, URL.createObjectURL(blob)];
      } catch (e) {
        console.warn('画像取得失敗:', name, e);
        return [name, null];
      }
    })).then((pairs) => {
      if (cancelled) {
        pairs.forEach(([, url]) => { if (url) URL.revokeObjectURL(url); });
        return;
      }
      const additions = {};
      pairs.forEach(([n, url]) => { if (url) additions[n] = url; });
      editUrlsRef.current = { ...editUrlsRef.current, ...additions };
      setEditImageUrls(prev => ({ ...prev, ...additions }));
    });
    return () => { cancelled = true; };
  }, [editingTrade, token]);

  // unmount で blob URL を revoke
  useEffect(() => {
    return () => {
      Object.values(editUrlsRef.current).forEach(url => {
        try { URL.revokeObjectURL(url); } catch { /* noop */ }
      });
      editUrlsRef.current = {};
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 画像圧縮（JPEG 品質 50%、最大長辺 1280px、縦横比維持）
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX_LONG_EDGE = 1280;
          let width = img.width;
          let height = img.height;
          const longEdge = Math.max(width, height);
          if (longEdge > MAX_LONG_EDGE) {
            const scale = MAX_LONG_EDGE / longEdge;
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleScreenshotChange = async (e) => {
    const input = e.target;
    const files = Array.from(input.files);
    const current = formData.screenshots.length;
    const selected = files.length;
    if (current + selected > MAX_SCREENSHOTS) {
      window.alert(`スクショは4枚までです。現在 ${current} 枚です。`);
      input.value = '';
      return;
    }
    try {
      const compressed = await Promise.all(files.map(file => compressImage(file)));
      setFormData(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, ...compressed]
      }));
    } catch (err) {
      console.error('画像圧縮エラー:', err);
      window.alert('画像の読み込みに失敗しました。別のファイルを試してください。');
    } finally {
      input.value = '';
    }
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

    // profit を数値化し NaN を弾く
    const profitNum = parseInt(formData.profit, 10);
    if (Number.isNaN(profitNum)) {
      window.alert('利益/損失は数値で入力してください');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        // 編集モード：imageRefs は元のまま保持、画像ファイルは触らない
        const { screenshots, ...rest } = formData;
        const updated = {
          ...rest,
          id: editingTrade.id,
          profit: profitNum,
          imageRefs: Array.isArray(editingTrade.imageRefs) ? editingTrade.imageRefs : [],
        };
        await Promise.resolve(onUpdate(updated));
        setToastMessage('✅ 更新しました');
        setShowToast(true);
        if (onEditComplete) onEditComplete();
      } else {
        // 新規：画像を Drive にアップロード → ファイル名を imageRefs に詰める
        const imgs = Array.isArray(formData.screenshots) ? formData.screenshots : [];
        const dateStr = (formData.date || '').split('T')[0];
        const imageRefs = [];
        if (imgs.length > 0) {
          const baseSeq = await computeNextSeq(token, dateStr, formData.pair);
          for (let i = 0; i < imgs.length; i++) {
            const name = buildImageName(dateStr, formData.pair, baseSeq + i);
            await uploadImage(token, name, imgs[i]);
            imageRefs.push(name);
          }
        }
        const { screenshots, ...rest } = formData;
        await Promise.resolve(
          onSave({
            ...rest,
            imageRefs,
            id: Date.now(),
            profit: profitNum
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
        setToastMessage('✅ 保存しました');
        setShowToast(true);
      }
    } catch (err) {
      console.error(isEditMode ? '更新エラー:' : '保存エラー:', err);
      window.alert(
        (isEditMode ? '更新' : '保存') + 'に失敗しました。\n\n' +
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
  } else if (screenshotCount >= 1 && screenshotCount <= 2) {
    counterColor = '#4caf50';
  } else if (screenshotCount === 3) {
    counterColor = '#ff9800';
    counterSuffix = '（残り1枚）';
  } else if (screenshotCount >= 4) {
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
          {toastMessage}
        </div>
      )}
      {isEditMode && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontWeight: 'bold',
          border: '1px solid #ffeeba'
        }}>
          ✏️ 編集モード
        </div>
      )}
      <h2>{isEditMode ? '✏️ トレード修正' : '📝 トレード入力'}</h2>
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
          {isEditMode ? (
            <>
              <p style={{ fontSize: '12px', color: '#856404', backgroundColor: '#fff3cd', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ffeeba', marginBottom: '8px' }}>
                画像の変更はできません。変更したい場合は削除→新規入力でお願いします。
              </p>
              {Array.isArray(editingTrade?.imageRefs) && editingTrade.imageRefs.length > 0 ? (
                <div style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                  {editingTrade.imageRefs.map((name, idx) => {
                    const url = editImageUrls[name];
                    return (
                      <div
                        key={idx}
                        style={{
                          width: '100%',
                          height: '100px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          backgroundColor: '#eee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          color: '#999',
                          fontSize: '11px',
                        }}
                      >
                        {url ? (
                          <img src={url} alt={`Screenshot ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          '読み込み中...'
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#999' }}>このトレードには画像がありません。</p>
              )}
            </>
          ) : (
            <>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                display: 'block',
                color: counterColor
              }}>
                📎 スクショ：{screenshotCount} / 4 枚{counterSuffix && ` ${counterSuffix}`}
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
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              flex: 1,
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
            {isSaving ? (isEditMode ? '更新中...' : '保存中...') : (isEditMode ? '更新' : '保存')}
          </button>
          {isEditMode && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => { if (onEditComplete) onEditComplete(); }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
