import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, Heart, ShoppingCart } from 'lucide-react';
import { productsApi } from '../../api/products';
import { cartApi } from '../../api/cart';
import { wishlistApi } from '../../api/wishlist';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, toNumber } from '../../utils/formatters';
import type { Product, ProductFilters } from '../../types';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const filters: ProductFilters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) || 'createdAt',
    order: (searchParams.get('order') as ProductFilters['order']) || 'desc',
  };

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.findAll(filters);
      setProducts(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      addToast('Erro ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchParams.toString()]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await productsApi.getCategories();
      setCategories(cats);
    } catch { /* silent */ }
  }, []);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const items = await wishlistApi.findAll();
      setWishlistIds(new Set(items.map((i) => i.productId)));
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await cartApi.addItem({ productId, quantity: 1 });
      await refreshCart();
      addToast('Adicionado ao carrinho!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao adicionar', 'error');
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (wishlistIds.has(productId)) {
        await wishlistApi.remove(productId);
        setWishlistIds((prev) => { const s = new Set(prev); s.delete(productId); return s; });
        addToast('Removido dos favoritos', 'info');
      } else {
        await wishlistApi.add(productId);
        setWishlistIds((prev) => new Set(prev).add(productId));
        addToast('Adicionado aos favoritos!', 'success');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro', 'error');
    }
  };

  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchValue || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  return (
    <div>
      <div className="page-header">
        <h1>Catálogo de Livros</h1>
        <p>Encontre seu próximo livro favorito</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            className="form-input search-input"
            placeholder="Buscar livros..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="category-pills">
          <button
            className={`category-pill ${!filters.category ? 'active' : ''}`}
            onClick={() => setFilter('category', null)}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${filters.category === cat ? 'active' : ''}`}
              onClick={() => setFilter('category', filters.category === cat ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 160 }}
          value={`${filters.sortBy}-${filters.order}`}
          onChange={(e) => {
            const [sortBy, order] = e.target.value.split('-');
            const params = new URLSearchParams(searchParams);
            params.set('sortBy', sortBy);
            params.set('order', order);
            params.delete('page');
            setSearchParams(params);
          }}
        >
          <option value="createdAt-desc">Mais recentes</option>
          <option value="createdAt-asc">Mais antigos</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name-asc">A-Z</option>
          <option value="name-desc">Z-A</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
              <div className="card-body">
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">Nenhum livro encontrado</h3>
          <p className="empty-state-description">
            Tente ajustar os filtros ou buscar por outro termo.
          </p>
          <button className="btn btn-secondary" onClick={() => {
            setSearchValue('');
            setSearchParams(new URLSearchParams());
          }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="product-card-image-wrapper">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="product-card-image" loading="lazy" />
                  ) : (
                    <div className="product-card-image-placeholder">
                      <BookOpen size={32} />
                    </div>
                  )}
                  <div className="product-card-actions">
                    <button
                      className={`wishlist-btn ${wishlistIds.has(product.id) ? 'active' : ''}`}
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      aria-label="Favoritar"
                    >
                      <Heart size={16} fill={wishlistIds.has(product.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                <div className="product-card-body">
                  <div className="product-card-category">{product.category}</div>
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-footer">
                    <span className="product-card-price">{formatCurrency(toNumber(product.price))}</span>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => handleAddToCart(e, product.id)}
                      disabled={product.stock === 0}
                      style={{ fontSize: '11px' }}
                    >
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                  {product.stock <= 3 && product.stock > 0 && (
                    <div className="product-card-stock low" style={{ marginTop: 4 }}>
                      Últimas {product.stock} unidades
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="product-card-stock low" style={{ marginTop: 4 }}>Esgotado</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 'var(--space-8)' }}>
              <button
                className="pagination-btn"
                disabled={filters.page === 1}
                onClick={() => setFilter('page', String((filters.page || 1) - 1))}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${p === filters.page ? 'active' : ''}`}
                  onClick={() => setFilter('page', String(p))}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={filters.page === totalPages}
                onClick={() => setFilter('page', String((filters.page || 1) + 1))}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
