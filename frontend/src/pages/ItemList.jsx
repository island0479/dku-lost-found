import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const showAll = searchParams.get('status') === 'all';
  const status = showAll ? '' : 'found';

  useEffect(() => {
    api.get('/categories/').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/items/', { params: { q, category, status } })
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, [q, category, status]);

  const handleSearch = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (fd.get('q')) next.set('q', fd.get('q'));
      else next.delete('q');
      return next;
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="page-title mb-0">분실물 목록</h4>
        <span className="text-muted small">{items.length}건</span>
      </div>

      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <div className="d-flex gap-2 align-items-center">
            <div className="position-relative" style={{ flex: '0 0 300px' }}>
              <i className="bi bi-search position-absolute"
                style={{ left: 13, top: '50%', transform: 'translateY(-50%)',
                         color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}></i>
              <input name="q" defaultValue={q} className="form-control" key={q}
                style={{ paddingLeft: 36 }} />
            </div>
            <button type="submit" className="btn btn-dark" style={{ flex: '0 0 90px' }}>검색</button>
            <select className="form-select" value={category} style={{ flex: '0 0 180px', marginLeft: 'auto' }}
              onChange={e => {
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  if (e.target.value) next.set('category', e.target.value);
                  else next.delete('category');
                  return next;
                });
              }}>
              <option value="">전체 카테고리</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className={`search-toggle${showAll ? ' active' : ''}`} style={{ flex: '0 0 200px', justifyContent: 'center' }}>
              <input type="checkbox" hidden checked={showAll}
                onChange={e => {
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (e.target.checked) next.set('status', 'all');
                    else next.delete('status');
                    return next;
                  });
                }} />
              반환 완료 분실물도 보기
            </label>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>등록된 분실물이 없습니다.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
          {items.map(item => (
            <div key={item.id} className="col">
              <Link to={`/item/${item.id}`} style={{ textDecoration: 'none' }}>
                <div className="card h-100 item-card">
                  {item.image_url ? (
                    <img src={item.image_url} className="card-img-top"
                      style={{ height: 176, objectFit: 'cover' }} alt={item.title} />
                  ) : (
                    <div className="img-placeholder" style={{ height: 176 }}>
                      <i className="bi bi-image" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                  )}
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                        {item.title}
                      </h6>
                      <span className={`ms-2 flex-shrink-0 ${item.status === 'found' ? 'badge-found' : 'badge-returned'}`}>
                        {item.status_display}
                      </span>
                    </div>
                    <p className="mb-1" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      <i className="bi bi-geo-alt me-1"></i>{item.location}
                    </p>
                    <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <i className="bi bi-calendar3 me-1"></i>{item.found_date}
                      {item.category_name && <span> · {item.category_name}</span>}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
