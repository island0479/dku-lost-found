import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function MyItems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) { navigate('/login'); return; }
    api.get('/my/items/').then(r => setItems(r.data)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-secondary" role="status"></div>
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">내 등록 목록</h4>
        <Link to="/item/new" className="btn btn-dark btn-sm">
          <i className="bi bi-plus-circle me-1"></i>새로 등록
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>아직 등록한 분실물이 없습니다.</p>
          <Link to="/item/new" className="btn btn-dark btn-sm mt-3">첫 번째 분실물 등록하기</Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
          {items.map(item => (
            <div key={item.id} className="col">
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
                  <p className="mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <i className="bi bi-calendar3 me-1"></i>{item.found_date}
                    {item.category_name && <span> · {item.category_name}</span>}
                  </p>
                  <div className="d-flex gap-2">
                    <Link to={`/item/${item.id}`} className="btn btn-dark btn-sm">상세보기</Link>
                    <Link to={`/item/${item.id}/edit`} className="btn btn-outline-secondary btn-sm">수정</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
