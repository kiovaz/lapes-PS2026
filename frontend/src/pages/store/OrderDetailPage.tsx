import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, X } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDateTime, getOrderStatusLabel, toNumber, formatZipCode } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../types';

const statusSteps: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchOrder = async () => {
    try {
      const data = await ordersApi.findOne(Number(id));
      setOrder(data);
    } catch {
      addToast('Pedido não encontrado', 'error');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(Number(id));
      await fetchOrder();
      addToast('Pedido cancelado', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao cancelar', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!order) return null;

  const canCancel = order.status === 'PENDING' || order.status === 'PAID';
  const currentStepIndex = statusSteps.indexOf(order.status as any);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/orders')} style={{ marginBottom: 'var(--space-6)' }}>
        <ArrowLeft size={16} />
        Voltar aos pedidos
      </button>

      <div className="page-header page-header-actions">
        <div>
          <h1>Pedido #{order.id}</h1>
          <p>{formatDateTime(order.createdAt)}</p>
        </div>
        {canCancel && (
          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Cancelar pedido'}
          </button>
        )}
      </div>

      <div className="cart-layout">
        <div>
          {/* Timeline */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Status</h3>

              {isCancelled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-error)' }}>
                  <div className="timeline-dot cancelled"><X size={14} /></div>
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Cancelado</h4>
                    <p className="text-xs text-secondary">Pedido cancelado. Estoque e pagamento devolvidos.</p>
                  </div>
                </div>
              ) : (
                <div className="order-timeline">
                  {statusSteps.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step} className="timeline-step">
                        <div className={`timeline-dot ${isCompleted ? (isCurrent ? 'active' : 'completed') : ''}`}>
                          {isCompleted ? <Check size={12} /> : <span style={{ fontSize: 10 }}>{i + 1}</span>}
                        </div>
                        <div className="timeline-content">
                          <h4 style={{ color: isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                            {getOrderStatusLabel(step)}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Itens</h3>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-medium">{item.product.name}</div>
                    <div className="text-xs text-secondary">
                      {item.quantity}× {formatCurrency(toNumber(item.priceAtPurchase))}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(toNumber(item.priceAtPurchase) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Summary */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Resumo</h3>
              {toNumber(order.discount) > 0 && (
                <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                  <span>Desconto</span>
                  <span>−{formatCurrency(toNumber(order.discount))}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatCurrency(toNumber(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          {order.shippingStreet && (
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} />
                  Entrega
                </h3>
                <div className="text-sm text-secondary" style={{ lineHeight: 'var(--leading-relaxed)' }}>
                  {order.shippingStreet}{order.shippingComplement ? `, ${order.shippingComplement}` : ''}<br />
                  {order.shippingNeighborhood} — {order.shippingCity}/{order.shippingState}<br />
                  CEP {formatZipCode(order.shippingZipCode || '')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
