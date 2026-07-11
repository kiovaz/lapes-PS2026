import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, CreditCard, Check } from 'lucide-react';
import { cartApi } from '../../api/cart';
import { addressesApi } from '../../api/addresses';
import { ordersApi } from '../../api/orders';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, toNumber, formatZipCode } from '../../utils/formatters';
import type { Cart, Address } from '../../types';

// Stripe Imports — separate elements for better layout control
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Shared Stripe element styles
const stripeElementStyle = {
  base: {
    fontSize: '14px',
    color: '#171717',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '::placeholder': {
      color: '#a3a3a3',
    },
  },
  invalid: {
    color: '#dc2626',
  },
};

function CheckoutPageInner() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { refreshCart } = useCart();
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const couponCode = (location.state as any)?.couponCode;

  // Stripe Hooks
  const stripe = useStripe();
  const elements = useElements();

  // Bug #3 fix: Stable idempotency key (generated once per checkout session)
  const idempotencyKey = useMemo(
    () => `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    [],
  );

  // Bug #3 fix: Ref-based guard to prevent concurrent checkout calls
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [cartData, addrsData] = await Promise.all([
          cartApi.get(),
          addressesApi.findAll(),
        ]);
        setCart(cartData);
        setAddresses(addrsData);
        const defaultAddr = addrsData.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
        else if (addrsData.length > 0) setSelectedAddress(addrsData[0].id);
      } catch {
        addToast('Erro ao carregar dados', 'error');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const subtotal = cart?.items?.reduce((sum, item) => sum + toNumber(item.product.price) * item.quantity, 0) ?? 0;

  const handleCheckout = async () => {
    // Guard: prevent concurrent calls
    if (isProcessingRef.current) return;

    if (!stripe || !elements) {
      addToast('O Stripe ainda está carregando. Por favor, aguarde.', 'warning');
      return;
    }

    if (!selectedAddress && addresses.length > 0) {
      addToast('Selecione um endereço de entrega', 'warning');
      return;
    }

    isProcessingRef.current = true;
    setProcessing(true);
    try {
      // 1. Criar o pedido e receber o PaymentIntent client secret do backend
      const result = await ordersApi.checkout({
        couponCode: couponCode || undefined,
        addressId: selectedAddress || undefined,
        idempotencyKey,
      });

      const clientSecret = result.clientSecret;
      if (!clientSecret) {
        throw new Error('Falha ao inicializar o pagamento: chave secreta não recebida.');
      }

      // 2. Obter referência ao CardNumberElement do Stripe (elementos separados)
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Elemento de pagamento com cartão não encontrado.');
      }

      // 3. Confirmar o pagamento com o Stripe
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: user ? `${user.firstName} ${user.lastName}` : 'Cliente E-commerce',
            email: user?.email || undefined,
          },
        },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || 'Falha ao confirmar pagamento.');
      }

      if (paymentResult.paymentIntent?.status === 'succeeded') {
        // 4. Bug #4 fix: Confirmar pagamento no backend para mudar status para PAID
        try {
          await ordersApi.confirmPayment(result.order.id);
        } catch {
          // Se falhar, não é crítico — o webhook pode atualizar depois
          console.warn('Não foi possível confirmar pagamento no backend, mas o pagamento foi realizado.');
        }

        setOrderId(result.order.id);
        setOrderCompleted(true);
        await refreshCart();
        addToast('Pedido realizado e pago com sucesso!', 'success');
      } else {
        throw new Error('O pagamento não pôde ser confirmado. Status: ' + paymentResult.paymentIntent?.status);
      }
    } catch (err: any) {
      addToast(err.message || err.response?.data?.message || 'Erro ao finalizar pedido', 'error');
    } finally {
      setProcessing(false);
      isProcessingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div className="empty-state">
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--color-success-light)', color: 'var(--color-success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <Check size={32} />
        </div>
        <h3 className="empty-state-title">Pedido realizado!</h3>
        <p className="empty-state-description">
          Seu pedido foi criado e pago com sucesso.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/orders/${orderId}`)}>
            Ver pedido
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Continuar comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Revise seu pedido e finalize a compra</p>
      </div>

      <div className="cart-layout">
        <div>
          {/* Address Selection */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} />
                Endereço de Entrega
              </h3>

              {addresses.length === 0 ? (
                <div>
                  <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
                    Nenhum endereço cadastrado.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/addresses')}>
                    Cadastrar endereço
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-card ${selectedAddress === addr.id ? 'default' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                          style={{ marginTop: 2 }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 2 }}>
                            {addr.label}
                            {addr.isDefault && <span className="badge badge-info" style={{ marginLeft: 8 }}>Padrão</span>}
                          </div>
                          <div className="text-sm text-secondary">
                            {addr.street}{addr.complement ? `, ${addr.complement}` : ''}<br />
                            {addr.neighborhood} — {addr.city}/{addr.state}<br />
                            CEP {formatZipCode(addr.zipCode)}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                Itens do Pedido
              </h3>
              {cart?.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-medium">{item.product.name}</div>
                    <div className="text-xs text-secondary">Qtd: {item.quantity} × {formatCurrency(toNumber(item.product.price))}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(toNumber(item.product.price) * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cart-summary">
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} />
                Resumo do Pedido
              </h3>

              <div className="summary-row">
                <span className="text-secondary">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {couponCode && (
                <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                  <span>Cupom: {couponCode.toUpperCase()}</span>
                  <span>Aplicado ✓</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Stripe Credit Card Form — Separate Elements (Bug #1 + #2 fix) */}
              <div style={{ margin: 'var(--space-5) 0 var(--space-4)' }}>
                <label className="form-label" style={{ marginBottom: 'var(--space-3)', display: 'block', fontWeight: 500 }}>Dados do Cartão</label>

                {/* Card Number — full width */}
                <div className="stripe-field-group">
                  <label className="stripe-field-label">Número do cartão</label>
                  <div className="stripe-field-input">
                    <CardNumberElement options={{ style: stripeElementStyle, showIcon: true }} />
                  </div>
                </div>

                {/* Expiry + CVC — 2 columns */}
                <div className="stripe-field-row">
                  <div className="stripe-field-group">
                    <label className="stripe-field-label">Validade</label>
                    <div className="stripe-field-input">
                      <CardExpiryElement options={{ style: stripeElementStyle }} />
                    </div>
                  </div>
                  <div className="stripe-field-group">
                    <label className="stripe-field-label">CVC</label>
                    <div className="stripe-field-input">
                      <CardCvcElement options={{ style: stripeElementStyle }} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={handleCheckout}
                disabled={processing}
              >
                {processing ? (
                  <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <>
                    <CreditCard size={16} />
                    Confirmar e Pagar
                  </>
                )}
              </button>

              <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
                Pagamento processado via Stripe de forma segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPageInner />
    </Elements>
  );
}
