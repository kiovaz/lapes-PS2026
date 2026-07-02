import { useState, useEffect, type FormEvent } from 'react';
import { MapPin, Plus, Star, Pencil, Trash2, X } from 'lucide-react';
import { addressesApi } from '../../api/addresses';
import { useToast } from '../../contexts/ToastContext';
import { formatZipCode } from '../../utils/formatters';
import type { Address } from '../../types';

const EMPTY_FORM = { label: 'Casa', street: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchAddresses = async () => {
    try {
      const data = await addressesApi.findAll();
      setAddresses(data);
    } catch {
      addToast('Erro ao carregar endereços', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label, street: addr.street, complement: addr.complement || '',
      neighborhood: addr.neighborhood, city: addr.city, state: addr.state, zipCode: addr.zipCode,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.street || !form.neighborhood || !form.city || !form.state || !form.zipCode) {
      addToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await addressesApi.update(editingId, form);
        addToast('Endereço atualizado', 'success');
      } else {
        await addressesApi.create(form);
        addToast('Endereço cadastrado', 'success');
      }
      setShowModal(false);
      await fetchAddresses();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este endereço?')) return;
    try {
      await addressesApi.remove(id);
      await fetchAddresses();
      addToast('Endereço removido', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao remover', 'error');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressesApi.setDefault(id);
      await fetchAddresses();
      addToast('Endereço padrão definido', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro', 'error');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header page-header-actions">
        <div>
          <h1>Endereços</h1>
          <p>Gerencie seus endereços de entrega (máx. 5)</p>
        </div>
        {addresses.length < 5 && (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Novo endereço
          </button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="empty-state">
          <MapPin size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">Nenhum endereço</h3>
          <p className="empty-state-description">Cadastre um endereço para entregas.</p>
          <button className="btn btn-primary" onClick={openCreate}>Cadastrar endereço</button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((addr) => (
            <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
              <div className="address-card-header">
                <div className="address-card-label">
                  <MapPin size={14} />
                  {addr.label}
                  {addr.isDefault && <span className="badge badge-info" style={{ fontSize: 10 }}>Padrão</span>}
                </div>
              </div>
              <div className="address-card-body">
                {addr.street}{addr.complement ? `, ${addr.complement}` : ''}<br />
                {addr.neighborhood} — {addr.city}/{addr.state}<br />
                CEP {formatZipCode(addr.zipCode)}
              </div>
              <div className="address-card-actions">
                {!addr.isDefault && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleSetDefault(addr.id)}>
                    <Star size={12} /> Definir padrão
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(addr)}>
                  <Pencil size={12} /> Editar
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(addr.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Endereço' : 'Novo Endereço'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Rótulo</label>
                  <input className="form-input" placeholder="Casa, Trabalho..." value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Logradouro *</label>
                  <input className="form-input" placeholder="Rua das Flores, 123" value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Complemento</label>
                  <input className="form-input" placeholder="Apto 42" value={form.complement}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Bairro *</label>
                    <input className="form-input" placeholder="Centro" value={form.neighborhood}
                      onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cidade *</label>
                    <input className="form-input" placeholder="São Paulo" value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">UF *</label>
                    <input className="form-input" placeholder="SP" maxLength={2} value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CEP *</label>
                    <input className="form-input" placeholder="01001000" maxLength={8} value={form.zipCode}
                      onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : (editingId ? 'Salvar' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
