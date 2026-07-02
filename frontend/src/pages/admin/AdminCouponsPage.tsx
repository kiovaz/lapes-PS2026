import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import { couponsApi } from '../../api/coupons';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate, toNumber, getCouponTypeLabel } from '../../utils/formatters';
import type { Coupon } from '../../types';

const EMPTY_FORM = { code: '', type: 'PERCENT' as string, value: '', minOrderValue: '', expiresAt: '' };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchCoupons = async () => {
    try {
      const data = await couponsApi.findAll();
      setCoupons(data);
    } catch {
      addToast('Erro ao carregar cupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(toNumber(c.value)),
      minOrderValue: String(toNumber(c.minOrderValue)),
      expiresAt: c.expiresAt.split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiresAt) {
      addToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }
    setSaving(true);
    const data = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : 0,
      expiresAt: new Date(form.expiresAt).toISOString(),
    };
    try {
      if (editingId) {
        await couponsApi.update(editingId, data);
        addToast('Cupom atualizado', 'success');
      } else {
        await couponsApi.create(data);
        addToast('Cupom criado', 'success');
      }
      setShowModal(false);
      await fetchCoupons();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este cupom?')) return;
    try {
      await couponsApi.remove(id);
      addToast('Cupom removido', 'info');
      await fetchCoupons();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao remover', 'error');
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  if (loading) {
    return <div className="page-loading"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Cupons</h1>
          <p>Gerencie cupons de desconto</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} />
          Novo Cupom
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="empty-state">
          <Tag size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">Nenhum cupom</h3>
          <p className="empty-state-description">Crie cupons para oferecer descontos aos clientes.</p>
          <button className="btn btn-primary" onClick={openCreate}>Criar cupom</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Mín. Pedido</th>
                <th>Validade</th>
                <th>Usos</th>
                <th style={{ width: 100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                      {c.code}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{getCouponTypeLabel(c.type)}</span>
                  </td>
                  <td className="font-medium">
                    {c.type === 'PERCENT' ? `${toNumber(c.value)}%` : formatCurrency(toNumber(c.value))}
                  </td>
                  <td className="text-secondary">
                    {toNumber(c.minOrderValue) > 0 ? formatCurrency(toNumber(c.minOrderValue)) : '—'}
                  </td>
                  <td>
                    <span style={{ color: isExpired(c.expiresAt) ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                      {formatDate(c.expiresAt)}
                      {isExpired(c.expiresAt) && ' (expirado)'}
                    </span>
                  </td>
                  <td>{c._count?.couponUsage ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-error)' }}
                        onClick={() => handleDelete(c.id)} title="Remover">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Cupom' : 'Novo Cupom'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Código *</label>
                  <input className="form-input" placeholder="LAPES10" value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="PERCENT">Percentual</option>
                      <option value="FIXED">Valor Fixo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor *</label>
                    <input type="number" step="0.01" min="0.01" className="form-input"
                      placeholder={form.type === 'PERCENT' ? '10' : '20.00'} value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })} required />
                    <span className="form-hint">{form.type === 'PERCENT' ? 'Percentual (max 100)' : 'Valor em R$'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor mínimo do pedido</label>
                  <input type="number" step="0.01" min="0" className="form-input" placeholder="50.00" value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de expiração *</label>
                  <input type="date" className="form-input" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : (editingId ? 'Salvar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
