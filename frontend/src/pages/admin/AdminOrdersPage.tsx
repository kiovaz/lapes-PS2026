import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDateTime, getOrderStatusLabel, toNumber } from '../../utils/formatters';
import type { Order } from '../../types';

const statusBadge: Record<string, string> = {
  PENDING: 'badge-warning',
  PAID: 'badge-info',
  SHIPPED: 'badge-info',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-error',
};

const nextStatusMap: Record<string, string> = {
  PENDING: 'PAID',
  PAID: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const { addToast } = useToast();

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.findAll();
      setOrders(data);
    } catch {
      addToast('Erro ao carregar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAdvanceStatus = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.advanceStatus(orderId, newStatus);
      await fetchOrders();
      addToast(`Status atualizado para ${getOrderStatusLabel(newStatus)}`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao atualizar status', 'error');
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm('Cancelar este pedido?')) return;
    try {
      await ordersApi.cancel(orderId);
      await fetchOrders();
      addToast('Pedido cancelado', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao cancelar', 'error');
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return <div className="page-loading"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pedidos</h1>
        <p>{orders.length} pedidos no total</p>
      </div>

      <div className="filters-bar">
        <div className="category-pills">
          {['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <button key={s} className={`category-pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'Todos' : getOrderStatusLabel(s)}
              {s !== 'ALL' && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({orders.filter((o) => o.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">Nenhum pedido</h3>
          <p className="empty-state-description">Nenhum pedido encontrado com este filtro.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">#{order.id}</td>
                  <td className="text-sm">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : `User #${order.userId}`}
                  </td>
                  <td className="text-sm text-secondary">{formatDateTime(order.createdAt)}</td>
                  <td>{order.items?.length || '-'}</td>
                  <td className="font-medium">{formatCurrency(toNumber(order.total))}</td>
                  <td>
                    <span className={`badge ${statusBadge[order.status] || 'badge-neutral'}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {nextStatusMap[order.status] && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAdvanceStatus(order.id, nextStatusMap[order.status])}
                        >
                          → {getOrderStatusLabel(nextStatusMap[order.status])}
                        </button>
                      )}
                      {(order.status === 'PENDING' || order.status === 'PAID') && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}
                          onClick={() => handleCancel(order.id)}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
