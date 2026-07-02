import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import { productsApi } from '../../api/products';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, toNumber } from '../../utils/formatters';
import type { Product } from '../../types';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: '', image: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.findAll({ page, limit: 20 });
      setProducts(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      addToast('Erro ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(toNumber(p.price)),
      stock: String(p.stock),
      category: p.category,
      image: p.image || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category) {
      addToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }
    setSaving(true);
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      category: form.category,
      image: form.image || undefined,
    };
    try {
      if (editingId) {
        await productsApi.update(editingId, data);
        addToast('Produto atualizado', 'success');
      } else {
        await productsApi.create(data);
        addToast('Produto criado', 'success');
      }
      setShowModal(false);
      await fetchProducts();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este produto?')) return;
    try {
      await productsApi.remove(id);
      addToast('Produto removido', 'info');
      await fetchProducts();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao remover', 'error');
    }
  };

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Produtos</h1>
          <p>Gerencie o catálogo de livros</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} />
          Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner spinner-lg" /></div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {p.image ? (
                          <img src={p.image} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={16} color="var(--color-text-tertiary)" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-secondary" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                    <td className="font-medium">{formatCurrency(toNumber(p.price))}</td>
                    <td>
                      <span style={{ color: p.stock <= 3 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p.id)}
                          style={{ color: 'var(--color-error)' }} title="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 'var(--space-6)' }}>
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" placeholder="Nome do livro" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <textarea className="form-input" placeholder="Descrição do livro" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Preço (R$) *</label>
                    <input type="number" step="0.01" min="0.01" className="form-input" placeholder="59.90" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estoque *</label>
                    <input type="number" min="0" className="form-input" placeholder="50" value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <input className="form-input" placeholder="tecnologia, fantasia..." value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">URL da Imagem</label>
                  <input type="url" className="form-input" placeholder="https://exemplo.com/imagem.jpg" value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })} />
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
