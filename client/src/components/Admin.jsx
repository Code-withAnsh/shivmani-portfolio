import { useCallback, useEffect, useMemo, useState } from 'react';
import './Admin.css';

// Private inbox at /admin. Not linked from the site. The server checks the login against ADMIN_USERNAME / ADMIN_PASSWORD in its .env.
const TOKEN_KEY = 'admin-token';
const FILTERS = ['all', 'unread', 'read', 'replied', 'archived'];

// Small fetch helper: adds the token, reads JSON, and throws an error that carries the status and lock time
async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* not JSON (server offline or static host) */ }
  if (!res.ok) {
    const err = new Error(data?.message || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.retryAfter = data?.retryAfter;
    err.attemptsLeft = data?.attemptsLeft;
    throw err;
  }
  return data;
}

const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [lockLeft, setLockLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [confirmId, setConfirmId] = useState('');

  // Keep this page out of search engines and give it its own title
  useEffect(() => {
    document.title = 'Admin · Shivmani Singh';
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex,nofollow';
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser('');
    setItems([]);
    setConfirmId('');
  }, []);

  // Countdown while the IP is locked after wrong passwords
  useEffect(() => {
    if (lockLeft <= 0) return undefined;
    const t = setInterval(() => setLockLeft((s) => (s > 1 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [lockLeft]);

  // A saved token is checked once on load. If it has expired, the login form comes back.
  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    api('/auth/me', { token })
      .then((d) => alive && setUser(d.data.username))
      .catch((e) => alive && e.status === 401 && logout());
    return () => { alive = false; };
  }, [token, logout]);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setListError('');
    try {
      const d = await api('/admin/contacts', { token });
      setItems(d.data);
    } catch (e) {
      if (e.status === 401) logout();
      else setListError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (user) loadMessages();
  }, [user, loadMessages]);

  const onLogin = async (e) => {
    e.preventDefault();
    if (busy || lockLeft > 0) return;
    setBusy(true);
    setLoginError('');
    try {
      const d = await api('/auth/login', { method: 'POST', body: { username: form.username, password: form.password } });
      sessionStorage.setItem(TOKEN_KEY, d.token);
      setForm({ username: '', password: '' });
      setToken(d.token);
      setUser(d.admin.username);
    } catch (err) {
      if (err.status === 429) {
        setLockLeft(err.retryAfter || 30);
        setLoginError(err.message);
      } else if (err.status === 401 && err.attemptsLeft) {
        setLoginError(`Wrong username or password. ${err.attemptsLeft} ${err.attemptsLeft === 1 ? 'try' : 'tries'} left.`);
      } else {
        setLoginError(err.message);
      }
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      const d = await api(`/admin/contacts/${id}/status`, { method: 'PATCH', body: { status }, token });
      setItems((list) => list.map((c) => (c._id === id ? d.data : c)));
    } catch (e) {
      if (e.status === 401) logout();
      else setListError(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api(`/admin/contacts/${id}`, { method: 'DELETE', token });
      setItems((list) => list.filter((c) => c._id !== id));
      setConfirmId('');
    } catch (e) {
      if (e.status === 401) logout();
      else setListError(e.message);
    }
  };

  const counts = useMemo(() => {
    const c = { all: items.length, unread: 0, read: 0, replied: 0, archived: 0 };
    items.forEach((i) => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [items]);

  const shown = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  );

  // ───── Login ─────
  if (!token || !user) {
    const locked = lockLeft > 0;
    return (
      <main className="adm adm--login">
        <div className="adm__glow" aria-hidden="true" />
        <form className="adm__card" onSubmit={onLogin}>
          <p className="adm__kick">[ Admin ]</p>
          <h1 className="adm__title">Sign in</h1>
          <label className="adm__field">
            <span>Username</span>
            <input
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </label>
          <label className="adm__field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {loginError && <p className="adm__error" role="alert">{loginError}</p>}
          <button className="adm__btn" type="submit" disabled={busy || locked}>
            {locked ? `Locked · ${lockLeft}s` : busy ? 'Checking…' : 'Log in'}
          </button>
          <a className="adm__back" href={import.meta.env.BASE_URL}>← Back to the site</a>
        </form>
      </main>
    );
  }

  // ───── Inbox ─────
  return (
    <main className="adm">
      <div className="adm__glow" aria-hidden="true" />
      <header className="adm__top">
        <div>
          <p className="adm__kick">[ Admin ]</p>
          <h1 className="adm__title">Inbox</h1>
        </div>
        <div className="adm__tools">
          <span className="adm__who">Signed in as {user}</span>
          <button className="adm__ghost" onClick={loadMessages} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="adm__ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="adm__stats" aria-label="Message counts">
        <div className="adm__stat"><b>{counts.all}</b><span>Total</span></div>
        <div className="adm__stat adm__stat--unread"><b>{counts.unread}</b><span>Unread</span></div>
        <div className="adm__stat adm__stat--replied"><b>{counts.replied}</b><span>Replied</span></div>
        <div className="adm__stat adm__stat--archived"><b>{counts.archived}</b><span>Archived</span></div>
      </section>

      <nav className="adm__filters" aria-label="Filter messages">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="adm__chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f} <i>{counts[f]}</i>
          </button>
        ))}
      </nav>

      {listError && <p className="adm__error" role="alert">{listError}</p>}

      <div className="adm__list">
        {shown.map((c) => (
          <article key={c._id} className={`adm__msg adm__msg--${c.status}`}>
            <header className="adm__msg-head">
              <div>
                <h3>{c.name}</h3>
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </div>
              <div className="adm__meta">
                <span className={`adm__pill adm__pill--${c.status}`}>{c.status}</span>
                <time dateTime={c.createdAt}>{fmt(c.createdAt)}</time>
              </div>
            </header>
            <p className="adm__subject">{c.subject}</p>
            <p className="adm__text">{c.message}</p>
            <footer className="adm__actions">
              <a className="adm__act" href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`}>Reply</a>
              {c.status === 'archived' ? (
                <button className="adm__act" onClick={() => setStatus(c._id, 'read')}>Restore</button>
              ) : (
                <>
                  {c.status === 'unread' && <button className="adm__act" onClick={() => setStatus(c._id, 'read')}>Mark read</button>}
                  {c.status !== 'replied' && <button className="adm__act" onClick={() => setStatus(c._id, 'replied')}>Mark replied</button>}
                  <button className="adm__act" onClick={() => setStatus(c._id, 'archived')}>Archive</button>
                </>
              )}
              {confirmId === c._id ? (
                <>
                  <button className="adm__act adm__act--danger" onClick={() => remove(c._id)}>Yes, delete</button>
                  <button className="adm__act" onClick={() => setConfirmId('')}>Keep</button>
                </>
              ) : (
                <button className="adm__act adm__act--danger" onClick={() => setConfirmId(c._id)}>Delete</button>
              )}
            </footer>
          </article>
        ))}
        {!loading && shown.length === 0 && (
          <p className="adm__empty">Nothing here yet.</p>
        )}
      </div>
    </main>
  );
}
