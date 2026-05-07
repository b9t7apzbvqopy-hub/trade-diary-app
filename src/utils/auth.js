const TOKEN_KEY = 'gdrive_access_token';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// GIS スクリプトの読み込み完了を待つ
const waitForGis = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      resolve();
      return;
    }
    let tries = 0;
    const interval = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        clearInterval(interval);
        resolve();
      } else if (++tries > 100) {
        clearInterval(interval);
        reject(new Error('Google Identity Services の読み込みに失敗しました'));
      }
    }, 100);
  });
};

export const getStoredToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveToken = (token) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* noop */
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
};

// アクセストークンを取得（OAuth ポップアップ）
export const requestAccessToken = async () => {
  await waitForGis();
  if (!CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID が未設定です');
  }
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        saveToken(response.access_token);
        resolve(response.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err && err.message ? err.message : '認証に失敗しました'));
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
};

// Drive about エンドポイントでトークン有効性検証
export const verifyToken = async (token) => {
  if (!token) return false;
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
};

// ログアウト：保存トークンの破棄 + revoke
export const signOut = () => {
  const token = getStoredToken();
  clearToken();
  if (token && window.google && window.google.accounts && window.google.accounts.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch {
      /* noop */
    }
  }
};
