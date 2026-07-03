import { useState, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp, MapPin, Mail } from 'lucide-react';
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
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
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

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
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
                <th style={{ width: 40 }}></th>
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
                <>
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(order.id)}>
                    <td>
                      {expandedOrderId === order.id
                        ? <ChevronUp size={16} style={{ opacity: 0.5 }} />
                        : <ChevronDown size={16} style={{ opacity: 0.5 }} />}
                    </td>
                    <td className="font-medium">#{order.id}</td>
                    <td className="text-sm">
                      <div>
                        <strong>{order.user ? `${order.user.firstName} ${order.user.lastName}` : `Usuário #${order.userId}`}</strong>
                      </div>
                      {order.user?.email && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          {order.user.email}
                        </div>
                      )}
                    </td>
                    <td className="text-sm text-secondary">{formatDateTime(order.createdAt)}</td>
                    <td>{order.items?.length || '-'}</td>
                    <td className="font-medium">{formatCurrency(toNumber(order.total))}</td>
                    <td>
                      <span className={`badge ${statusBadge[order.status] || 'badge-neutral'}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
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

                  {expandedOrderId === order.id && (
                    <tr key={`${order.id}-details`} className="order-details-row">
                      <td colSpan={8} style={{ padding: 'var(--space-4) var(--space-6)', background: 'var(--color-bg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
                          {/* Endereço de entrega */}
                          <div style={{ flex: '1 1 280px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                              <MapPin size={14} />
                              Endereço de Entrega
                            </div>
                            {order.shippingStreet ? (
                              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                <div>{order.shippingStreet}{order.shippingComplement ? `, ${order.shippingComplement}` : ''}</div>
                                <div>{order.shippingNeighborhood}</div>
                                <div>{order.shippingCity} — {order.shippingState}</div>
                                <div>CEP: {order.shippingZipCode}</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
                                Endereço não informado
                              </div>
                            )}
                          </div>

                          {/* Contato do cliente */}
                          {order.user && (
                            <div style={{ flex: '1 1 200px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                <Mail size={14} />
                                Contato
                              </div>
                              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                <div>{order.user.firstName} {order.user.lastName}</div>
                                <div>{order.user.email}</div>
                              </div>
                            </div>
                          )}

                          {/* Itens do pedido */}
                          <div style={{ flex: '2 1 300px' }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                              Itens do Pedido
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                              {order.items?.map((item) => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                                  {item.product?.image && (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      style={{ width: 32, height: 42, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                                    />
                                  )}
                                  <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>
                                    {item.product?.name || `Produto #${item.productId}`}
                                  </span>
                                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                                    x{item.quantity}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(toNumber(item.priceAtPurchase) * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

