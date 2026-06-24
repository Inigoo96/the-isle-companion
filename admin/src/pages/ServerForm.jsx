import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import styles from './ServerForm.module.css';

export default function ServerForm() {
  const { slug } = useParams();
  const isEdit = !!slug;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    slug: '', name: '', growthMultiplier: '1.00', rules: ''
  });
  const [allDinos, setAllDinos]     = useState([]);
  const [allowedDinos, setAllowed]  = useState(new Set());
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    api.get('/dinos').then(d => setAllDinos(d));
    if (isEdit) {
      api.get(`/servers/${slug}`).then(s => {
        setForm({
          slug: s.slug,
          name: s.name,
          growthMultiplier: s.growthMultiplier,
          rules: s.rules || ''
        });
        setAllowed(new Set(s.allowedDinos?.map(d => d.id) || []));
      });
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
    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        growthMultiplier: parseFloat(form.growthMultiplier),
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
      <h1 className={styles.title}>{isEdit ? 'Edit Server' : 'New Server'}</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

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

        <div className={styles.field} style={{ maxWidth: 200 }}>
          <label>Growth Multiplier</label>
          <input type="number" min="0.1" max="100" step="0.1"
            value={form.growthMultiplier}
            onChange={e => set('growthMultiplier', e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label>Rules / Description</label>
          <textarea rows={4} value={form.rules}
            onChange={e => set('rules', e.target.value)}
            placeholder="Optional server rules or description…" />
        </div>

        <div className={styles.field}>
          <label>Allowed Dinosaurs ({allowedDinos.size} selected — leave empty for all)</label>
          <div className={styles.dinoGrid}>
            {allDinos.map(d => (
              <label key={d.id} className={`${styles.dinoChip} ${allowedDinos.has(d.id) ? styles.selected : ''}`}>
                <input type="checkbox" checked={allowedDinos.has(d.id)}
                  onChange={() => toggleDino(d.id)} />
                {d.name}
              </label>
            ))}
          </div>
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
