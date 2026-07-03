import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await ordersApi.findAll();
        setOrders(data);
      } catch {
        addToast('Erro ao carregar pedidos', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <Package size={48} className="empty-state-icon" />
        <h3 className="empty-state-title">Nenhum pedido</h3>
        <p className="empty-state-description">Você ainda não realizou nenhum pedido.</p>
        <Link to="/" className="btn btn-primary">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Meus Pedidos</h1>
        <p>{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit', transition: 'border-color var(--transition-fast)' }}
          >
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-tertiary)'
                }}>
                  <Package size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold">Pedido #{order.id}</div>
                  <div className="text-xs text-secondary">{formatDateTime(order.createdAt)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-sm font-semibold">{formatCurrency(toNumber(order.total))}</div>
                  <div className="text-xs text-secondary">
                    {order.items?.length || '?'} {(order.items?.length || 0) === 1 ? 'item' : 'itens'}
                  </div>
                </div>
                <span className={`badge ${statusBadge[order.status] || 'badge-neutral'}`}>
                  {getOrderStatusLabel(order.status)}
                </span>
                <ChevronRight size={16} color="var(--color-text-tertiary)" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
