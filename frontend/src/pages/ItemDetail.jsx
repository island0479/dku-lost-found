import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ message: '', contact: '' });
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState('');
  const [editingInquiry, setEditingInquiry] = useState(false);
  const [editForm, setEditForm] = useState({ message: '', contact: '' });

  const fetchItem = () =>
    api.get(`/items/${id}/`).then(r => setItem(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchItem(); }, [id, user]);

  const handleInquiry = async e => {
    e.preventDefault();
    await api.post(`/items/${id}/inquiries/`, inquiryForm);
    setInquirySuccess(true);
  };

  const handleReturn = async e => {
    e.preventDefault();
    if (!confirm('반환 완료 처리하시겠습니까?')) return;
    const data = selectedInquiry ? { inquiry_id: selectedInquiry } : {};
    const r = await api.post(`/items/${id}/return/`, data);
    setItem(r.data);
  };

  const handleInquiryEdit = async e => {
    e.preventDefault();
    try {
      const r = await api.patch(`/items/${id}/inquiries/${item.my_inquiry.id}/`, editForm);
      setItem(prev => ({ ...prev, my_inquiry: r.data }));
      setEditingInquiry(false);
    } catch (err) {
      alert('저장 실패: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleInquiryDelete = async () => {
    if (!confirm('문의를 삭제하시겠습니까?')) return;
    await api.delete(`/items/${id}/inquiries/${item.my_inquiry.id}/`);
    setItem(prev => ({ ...prev, my_inquiry: null }));
    setInquirySuccess(false);
  };

  const handleRevert = async () => {
    if (!confirm('보관 중으로 되돌리시겠습니까?')) return;
    const r = await api.post(`/items/${id}/return/`, { action: 'revert' });
    setItem(r.data);
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-secondary" role="status"></div>
    </div>
  );
  if (!item) return <p className="text-muted">항목을 찾을 수 없습니다.</p>;

  return (
    <>
    {lightboxIdx !== null && (() => {
      const imgs = item.images?.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
      return (
        <div onClick={() => setLightboxIdx(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.max(0, i - 1)); }}
            style={{ position: 'absolute', left: 24, background: 'rgba(255,255,255,0.15)',
                     border: 'none', color: '#fff', borderRadius: '50%', width: 48, height: 48,
                     fontSize: '1.3rem', cursor: 'pointer', display: lightboxIdx > 0 ? 'flex' : 'none',
                     alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <img src={imgs[lightboxIdx]} onClick={e => e.stopPropagation()}
            style={{ width: '85vw', height: '85vh', objectFit: 'contain', borderRadius: 12 }}
            alt="" />
          <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.min(imgs.length - 1, i + 1)); }}
            style={{ position: 'absolute', right: 24, background: 'rgba(255,255,255,0.15)',
                     border: 'none', color: '#fff', borderRadius: '50%', width: 48, height: 48,
                     fontSize: '1.3rem', cursor: 'pointer', display: lightboxIdx < imgs.length - 1 ? 'flex' : 'none',
                     alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-chevron-right"></i>
          </button>
          <button onClick={() => setLightboxIdx(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)',
                     border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40,
                     fontSize: '1rem', cursor: 'pointer', display: 'flex',
                     alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-x-lg"></i>
          </button>
          {imgs.length > 1 && (
            <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              {lightboxIdx + 1} / {imgs.length}
            </div>
          )}
        </div>
      );
    })()}
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-body p-4">

            {/* 제목 + 상태 + 버튼 */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0">{item.title}</h4>
                <span className={item.status === 'found' ? 'badge-found' : 'badge-returned'}>
                  {item.status_display}
                </span>
              </div>
              <div className="d-flex gap-2 ms-3 flex-shrink-0">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>목록으로</button>
                {item.can_manage && (
                  <Link to={`/item/${item.id}/edit`} className="btn btn-dark btn-sm">수정</Link>
                )}
              </div>
            </div>

            {/* 사진 썸네일 */}
            {(() => {
              const imgs = item.images?.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
              if (imgs.length === 0) return null;
              return (
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {imgs.map((url, i) => (
                    <img key={i} src={url} onClick={() => setLightboxIdx(i)}
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10,
                               cursor: 'pointer', border: '1.5px solid var(--border)',
                               transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.target.style.opacity = 0.8}
                      onMouseLeave={e => e.target.style.opacity = 1}
                      alt={`사진 ${i + 1}`} />
                  ))}
                </div>
              );
            })()}

            {/* 정보 테이블 */}
            <table className="table table-borderless mb-4">
              <tbody>
                <tr><th className="text-muted fw-normal" style={{ width: 110 }}>카테고리</th><td>{item.category_name || '없음'}</td></tr>
                <tr><th className="text-muted fw-normal">발견 장소</th><td>{item.location}</td></tr>
                <tr><th className="text-muted fw-normal">발견 날짜</th><td>{item.found_date}</td></tr>
                <tr><th className="text-muted fw-normal">등록자</th><td>{item.registered_by_name || '알 수 없음'}</td></tr>
                <tr><th className="text-muted fw-normal">설명</th><td>{item.description}</td></tr>
                {item.returned_to_username && (
                  <tr>
                    <th className="text-muted fw-normal">반환 대상</th>
                    <td>
                      <span className="text-success fw-bold">{item.returned_to_username}</span>
                      <span className="text-muted small"> ({item.returned_to_contact})</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {item.can_manage ? (
              /* 작성자/관리자 영역 */
              <>
                {item.status === 'returned' && (
                  <div className="mb-4">
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleRevert}>
                      <i className="bi bi-arrow-counterclockwise me-1"></i>보관 중으로 되돌리기
                    </button>
                  </div>
                )}

                {item.status === 'found' && (
                  <div className="bg-light rounded p-3 mb-4">
                    <h6 className="fw-bold mb-3">반환 완료 처리</h6>
                    <form onSubmit={handleReturn}>
                      {item.inquiries?.length > 0 ? (
                        <>
                          <p className="text-muted small mb-2">문의자 중 반환한 사람을 선택하세요.</p>
                          {item.inquiries.map(inq => (
                            <div key={inq.id} className="form-check mb-1">
                              <input className="form-check-input" type="radio"
                                name="inquiry" id={`inq_${inq.id}`} value={inq.id}
                                onChange={e => setSelectedInquiry(e.target.value)} />
                              <label className="form-check-label" htmlFor={`inq_${inq.id}`}>
                                <strong>{inq.username}</strong>
                                <span className="text-muted small"> ({inq.contact})</span>
                              </label>
                            </div>
                          ))}
                          <div className="form-check mb-3">
                            <input className="form-check-input" type="radio"
                              name="inquiry" id="inq_none" value="" defaultChecked
                              onChange={() => setSelectedInquiry('')} />
                            <label className="form-check-label text-muted" htmlFor="inq_none">
                              문의자 없이 반환
                            </label>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted small mb-3">아직 문의가 없습니다.</p>
                      )}
                      <button type="submit" className="btn btn-success btn-sm">
                        <i className="bi bi-check-circle me-1"></i>반환 완료
                      </button>
                    </form>
                  </div>
                )}

                <h6 className="fw-bold mb-3">
                  문의 목록 <span className="text-muted fw-normal">({item.inquiries?.length || 0}건)</span>
                </h6>
                {item.inquiries?.length > 0 ? (
                  item.inquiries.map(inq => (
                    <div key={inq.id}
                      className={`border rounded p-3 mb-2 ${item.returned_to_id === inq.id ? 'border-success bg-light' : ''}`}>
                      <div className="d-flex justify-content-between mb-1">
                        <strong>{inq.username}</strong>
                        <span className="text-muted small">
                          {new Date(inq.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="mb-1 small">{inq.message}</p>
                      <p className="mb-0 text-muted small">
                        <i className="bi bi-telephone me-1"></i>{inq.contact}
                      </p>
                      {item.returned_to_id === inq.id && (
                        <span className="badge bg-success mt-1">반환 완료 대상</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">아직 문의가 없습니다.</p>
                )}
              </>
            ) : (
              /* 일반 사용자 영역 */
              <>
                {item.status === 'found' ? (
                  user ? (
                    item.my_inquiry ? (
                      <div className="bg-light rounded p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-bold mb-0">
                            <i className="bi bi-check-circle-fill text-success me-1"></i>문의 완료
                          </h6>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary btn-sm"
                              onClick={() => { setEditingInquiry(true); setEditForm({ message: item.my_inquiry.message, contact: item.my_inquiry.contact }); }}>
                              수정
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={handleInquiryDelete}>
                              삭제
                            </button>
                          </div>
                        </div>
                        {editingInquiry ? (
                          <form onSubmit={handleInquiryEdit}>
                            <div className="mb-2">
                              <textarea className="form-control" rows={3} value={editForm.message}
                                onChange={e => setEditForm({ ...editForm, message: e.target.value })} required />
                            </div>
                            <div className="mb-2">
                              <input className="form-control" type="text" value={editForm.contact}
                                onChange={e => setEditForm({ ...editForm, contact: e.target.value })} required />
                            </div>
                            <div className="d-flex gap-2">
                              <button type="submit" className="btn btn-dark btn-sm">저장</button>
                              <button type="button" className="btn btn-outline-secondary btn-sm"
                                onClick={() => setEditingInquiry(false)}>취소</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className="mb-1 small">{item.my_inquiry.message}</p>
                            <p className="mb-0 text-muted small">
                              <i className="bi bi-telephone me-1"></i>{item.my_inquiry.contact}
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-light rounded p-3">
                        <h6 className="fw-bold mb-3">
                          <i className="bi bi-question-circle me-1"></i>내 물건인 것 같아요
                        </h6>
                        <form onSubmit={handleInquiry}>
                          <div className="mb-3">
                            <label className="form-label fw-medium">문의 내용</label>
                            <textarea className="form-control" rows={3}
                              placeholder="내 물건인 것 같은 이유나 특징을 적어주세요."
                              value={inquiryForm.message}
                              onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                              required />
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-medium">연락처</label>
                            <input className="form-control" type="text"
                              placeholder="등록자가 연락할 수 있는 번호나 이메일"
                              value={inquiryForm.contact}
                              onChange={e => setInquiryForm({ ...inquiryForm, contact: e.target.value })}
                              required />
                          </div>
                          <button type="submit" className="btn btn-dark btn-sm">
                            <i className="bi bi-send me-1"></i>문의 보내기
                          </button>
                        </form>
                      </div>
                    )
                  ) : (
                    <p className="text-muted">
                      내 물건인 것 같다면 <Link to="/login">로그인</Link> 후 문의할 수 있습니다.
                    </p>
                  )
                ) : (
                  <p className="text-muted">
                    <i className="bi bi-check-circle text-success me-1"></i>이미 반환 완료된 물건입니다.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
