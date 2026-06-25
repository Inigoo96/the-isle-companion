import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import styles from './ServerForm.module.css';

export default function ServerForm() {
  const { slug } = useParams();
  const isEdit = !!slug;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    slug: '', name: '', growthMultiplier: '1.00', rules: '', discordInviteUrl: ''
  });
  const [allDinos, setAllDinos]       = useState([]);
  const [allowedDinos, setAllowed]    = useState(new Set());
  const [guilds, setGuilds]           = useState([]);          // eligible guilds (create only)
  const [guildId, setGuildId]         = useState('');          // selected guild (create)
  const [guildName, setGuildName]     = useState('');          // existing guild (edit)
  const [status, setStatus]           = useState('');          // existing status (edit)
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    const dinosPromise = api.get('/dinos').then(d => { setAllDinos(d); return d; });

    if (isEdit) {
      // The public GET /servers/{slug} only returns accepted servers, so load the
      // owner's own server (including pending) from /servers/mine.
      Promise.all([dinosPromise, api.get('/servers/mine')])
        .then(([dinos, mine]) => {
          const s = (mine || []).find(x => x.slug === slug);
          if (!s) { setError('Server not found'); return; }
          setForm({
            slug: s.slug, name: s.name, growthMultiplier: s.growthMultiplier,
            rules: s.rules || '', discordInviteUrl: s.discordInviteUrl || ''
          });
          setGuildName(s.discordGuildName || '');
          setStatus(s.status || '');
          const allAllowed = s.allowedDinos?.length === dinos.length;
          setAllowed(allAllowed ? new Set() : new Set(s.allowedDinos?.map(d => d.id) || []));
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      Promise.all([dinosPromise, api.get('/admin/guilds')])
        .then(([, g]) => setGuilds(g || []))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleDino(id) {
    setAllowed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEdit && !guildId) { setError('Pick the Discord server you administrate.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        slug: form.slug,
        name: form.name,
        growthMultiplier: parseFloat(form.growthMultiplier),
        rules: form.rules,
        discordInviteUrl: form.discordInviteUrl || null,
        discordGuildId: isEdit ? null : guildId,
        allowedDinoIds: [...allowedDinos]
      };
      if (isEdit) {
        await api.put(`/servers/${slug}`, body);
      } else {
        await api.post('/servers', body);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete server "${form.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/servers/${slug}`);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Dashboard</Link>
            <span>/</span>
            <span>{isEdit ? form.name || slug : 'New Server'}</span>
          </div>
          <h1 className={styles.title}>{isEdit ? 'Edit Server' : 'New Server'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        {/* New server: pick the verified Discord guild you own/administrate */}
        {!isEdit && (
          <div className={styles.field}>
            <label>Discord Server (verified ownership)</label>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your Discord servers…</p>
            ) : guilds.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                No eligible Discord servers found. You must be the <strong>owner</strong> or have
                <strong> Administrator</strong> in a Discord server. If you recently got access,
                <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }}> log in again</a> to refresh.
              </p>
            ) : (
              <div className={styles.dinoGrid}>
                {guilds.map(g => (
                  <label key={g.id} className={`${styles.dinoChip} ${guildId === g.id ? styles.selected : ''}`}>
                    <input type="radio" name="guild" checked={guildId === g.id}
                      onChange={() => setGuildId(g.id)} />
                    {g.iconUrl && <img src={g.iconUrl} alt="" style={{ width: 18, height: 18, borderRadius: 4, marginRight: 6, verticalAlign: 'middle' }} />}
                    {g.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit: show the (immutable) verified guild + moderation status */}
        {isEdit && (
          <div className={styles.field}>
            <label>Discord Server</label>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {guildName || '—'} {status && <span>· status: <strong>{status}</strong></span>}
            </p>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Server Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="My Isle Server" required />
          </div>
          <div className={styles.field}>
            <label>Slug (URL id)</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)}
              placeholder="my-server" required disabled={isEdit}
              pattern="[a-z0-9\-]+" title="Lowercase letters, numbers and hyphens only" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field} style={{ maxWidth: 200 }}>
            <label>Growth Multiplier</label>
            <input type="number" min="0.05" max="100" step="0.05"
              value={form.growthMultiplier}
              onChange={e => set('growthMultiplier', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Discord Invite (optional)</label>
            <input value={form.discordInviteUrl} onChange={e => set('discordInviteUrl', e.target.value)}
              placeholder="https://discord.gg/…" />
          </div>
        </div>

        <div className={styles.field}>
          <label>Rules / Description</label>
          <textarea rows={4} value={form.rules}
            onChange={e => set('rules', e.target.value)}
            placeholder="Optional server rules or description…" />
        </div>

        <div className={styles.field}>
          <label>Allowed Dinosaurs</label>
          <div className={styles.dinoGrid}>
            {allDinos.map(d => (
              <label key={d.id} className={`${styles.dinoChip} ${allowedDinos.has(d.id) ? styles.selected : ''}`}>
                <input type="checkbox" checked={allowedDinos.has(d.id)}
                  onChange={() => toggleDino(d.id)} />
                {d.name}
              </label>
            ))}
          </div>
          <p className={styles.dinoCount}>
            {allowedDinos.size === 0 ? 'All dinosaurs allowed (none selected)' : `${allowedDinos.size} of ${allDinos.length} selected`}
          </p>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Server'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={() => navigate('/')}>
            Cancel
          </button>
          {isEdit && (
            <button type="button" className={styles.btnDanger} onClick={handleDelete}>
              Delete Server
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
