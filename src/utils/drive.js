const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const ROOT_NAME = 'トレード日記';
const IMAGES_NAME = '画像';
const TRADES_FILE = 'trades.json';

let cachedFolders = null;

export const resetFolderCache = () => {
  cachedFolders = null;
};

const handleDriveError = async (res) => {
  let body = {};
  try { body = await res.json(); } catch { /* noop */ }
  if (res.status === 401) {
    const e = new Error('ログインの有効期限が切れました。再度ログインしてください。');
    e.code = 401;
    throw e;
  }
  if (res.status === 403) {
    const reason = body && body.error && body.error.errors && body.error.errors[0] && body.error.errors[0].reason;
    if (reason === 'storageQuotaExceeded') {
      const e = new Error('Google Driveの容量が不足しています。');
      e.code = 403;
      throw e;
    }
  }
  const msg = (body && body.error && body.error.message) ? body.error.message : res.statusText;
  throw new Error('エラーが発生しました: ' + msg);
};

const fetchDrive = async (url, options = {}) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('通信環境が必要です。電波の良い場所で再度お試しください。');
  }
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('通信環境が必要です。電波の良い場所で再度お試しください。');
  }
  if (!res.ok) await handleDriveError(res);
  return res;
};

const escapeQuery = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const findFolder = async (token, name, parentId) => {
  const q = encodeURIComponent(
    `name='${escapeQuery(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
    (parentId ? ` and '${parentId}' in parents` : '')
  );
  const res = await fetchDrive(`${DRIVE}/files?q=${q}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.files && data.files[0] ? data.files[0].id : null;
};

const createFolder = async (token, name, parentId) => {
  const res = await fetchDrive(`${DRIVE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const data = await res.json();
  return data.id;
};

export const ensureFolders = async (token) => {
  if (cachedFolders) return cachedFolders;
  let rootId = await findFolder(token, ROOT_NAME, null);
  if (!rootId) rootId = await createFolder(token, ROOT_NAME, null);
  let imagesId = await findFolder(token, IMAGES_NAME, rootId);
  if (!imagesId) imagesId = await createFolder(token, IMAGES_NAME, rootId);
  cachedFolders = { rootId, imagesId };
  return cachedFolders;
};

const findFile = async (token, name, parentId) => {
  const q = encodeURIComponent(
    `name='${escapeQuery(name)}' and trashed=false and '${parentId}' in parents`
  );
  const res = await fetchDrive(`${DRIVE}/files?q=${q}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.files && data.files[0] ? data.files[0].id : null;
};

const listFiles = async (token, parentId) => {
  const q = encodeURIComponent(`'${parentId}' in parents and trashed=false`);
  const res = await fetchDrive(`${DRIVE}/files?q=${q}&fields=files(id,name)&pageSize=1000&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.files || [];
};

export const getTradesJson = async (token) => {
  const { rootId } = await ensureFolders(token);
  const fileId = await findFile(token, TRADES_FILE, rootId);
  if (!fileId) return { trades: [], fileId: null };
  const res = await fetchDrive(`${DRIVE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let trades;
  try {
    trades = JSON.parse(text);
    if (!Array.isArray(trades)) throw new Error('not array');
  } catch {
    window.alert('データファイルが破損していたため、空の状態で再開しました。');
    trades = [];
    await saveTradesJson(token, []);
  }
  return { trades, fileId };
};

export const saveTradesJson = async (token, trades) => {
  const { rootId } = await ensureFolders(token);
  const fileId = await findFile(token, TRADES_FILE, rootId);
  const json = JSON.stringify(trades, null, 2);
  if (fileId) {
    await fetchDrive(`${UPLOAD}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: json,
    });
    return fileId;
  }
  const boundary = '-------314159265358979323846';
  const metadata = {
    name: TRADES_FILE,
    parents: [rootId],
    mimeType: 'application/json',
  };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    json +
    `\r\n--${boundary}--`;
  const res = await fetchDrive(`${UPLOAD}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const data = await res.json();
  return data.id;
};

const dataUrlToBlob = (dataUrl) => {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/:(.*?);/) || ['', 'image/jpeg'])[1];
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const safePair = (pair) => String(pair || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '_');

// 画像フォルダ内で同日同ペアの最大連番 +1 を返す
export const computeNextSeq = async (token, dateStr, pair) => {
  const { imagesId } = await ensureFolders(token);
  const files = await listFiles(token, imagesId);
  const prefix = `${dateStr}_${safePair(pair)}_`;
  let max = 0;
  for (const f of files) {
    if (f.name.startsWith(prefix)) {
      const m = f.name.slice(prefix.length).match(/^(\d+)\./);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  }
  return max + 1;
};

export const buildImageName = (dateStr, pair, seq) => `${dateStr}_${safePair(pair)}_${seq}.jpg`;

export const uploadImage = async (token, fileName, dataUrl) => {
  const { imagesId } = await ensureFolders(token);
  const blob = dataUrlToBlob(dataUrl);
  const boundary = '-------314159265358979323846';
  const metadata = {
    name: fileName,
    parents: [imagesId],
  };
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${blob.type}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, blob, tail], { type: `multipart/related; boundary=${boundary}` });
  const res = await fetchDrive(`${UPLOAD}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const data = await res.json();
  return data.id;
};

export const downloadImageBlob = async (token, fileName) => {
  const { imagesId } = await ensureFolders(token);
  const fileId = await findFile(token, fileName, imagesId);
  if (!fileId) return null;
  const res = await fetchDrive(`${DRIVE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.blob();
};

export const deleteImageByName = async (token, fileName) => {
  const { imagesId } = await ensureFolders(token);
  const fileId = await findFile(token, fileName, imagesId);
  if (!fileId) return;
  await fetchDrive(`${DRIVE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteAllImages = async (token) => {
  const { imagesId } = await ensureFolders(token);
  const files = await listFiles(token, imagesId);
  for (const f of files) {
    try {
      await fetchDrive(`${DRIVE}/files/${f.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('画像削除失敗:', f.name, e);
    }
  }
};
