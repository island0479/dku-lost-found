import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

export default function Navbar() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [pwModal, setPwModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await api.post('/auth/password/', { old_password: pwForm.old_password, new_password: pwForm.new_password });
      setPwModal(false);
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      setPwError('');
      alert('비밀번호가 변경됐습니다.');
    } catch (err) {
      setPwError(err.response?.data?.error || '변경에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async e => {
    e.preventDefault();
    try {
      await api.delete('/auth/account/', { data: { password: deletePassword } });
      setUser(null);
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || '탈퇴에 실패했습니다.');
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="bi bi-search-heart me-2"></i>DKU 분실물 센터
          </Link>
          <button className="navbar-toggler border-0" type="button"
            data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-1">
              {user ? (
                <>
                  <li className="nav-item user-dropdown-wrapper">
                    <span className="navbar-user">
                      <i className="bi bi-person-circle me-1"></i>{user.username}<i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.7rem', opacity: 0.5 }}></i>
                    </span>
                    <div className="user-dropdown">
                      <button onClick={() => { setPwModal(true); setPwError(''); }}>
                        계정 설정
                      </button>
                      <button className="danger" onClick={() => { setDeleteModal(true); setDeleteError(''); }}>
                        계정 탈퇴
                      </button>
                    </div>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/item/new">
                      <i className="bi bi-plus-circle me-1"></i>분실물 등록
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/my">
                      <i className="bi bi-list-ul me-1"></i>내 등록 목록
                    </Link>
                  </li>
                  <li className="nav-item ms-lg-1">
                    <button className="btn-nav-logout" onClick={handleLogout}>로그아웃</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">로그인</Link>
                  </li>
                  <li className="nav-item ms-lg-1">
                    <Link className="btn-nav-primary" to="/signup">회원가입</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* 비밀번호 변경 모달 */}
      {pwModal && (
        <div className="modal-overlay" onClick={() => setPwModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h5>계정 설정</h5>
            {pwError && <div className="alert-danger mb-3">{pwError}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="mb-3">
                <label className="form-label">현재 비밀번호</label>
                <input type="password" className="form-control" value={pwForm.old_password}
                  onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">새 비밀번호</label>
                <input type="password" className="form-control" value={pwForm.new_password}
                  onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required />
              </div>
              <div className="mb-4">
                <label className="form-label">새 비밀번호 확인</label>
                <input type="password" className="form-control" value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-dark">변경</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setPwModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 계정 탈퇴 모달 */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h5>계정 탈퇴</h5>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              탈퇴 시 등록한 분실물 및 문의 내역이 모두 삭제됩니다. 계속하려면 비밀번호를 입력하세요.
            </p>
            {deleteError && <div className="alert-danger mb-3">{deleteError}</div>}
            <form onSubmit={handleDeleteAccount}>
              <div className="mb-4">
                <label className="form-label">비밀번호</label>
                <input type="password" className="form-control" value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)} required />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-dark" style={{ background: '#D92B2B', borderColor: '#D92B2B' }}>탈퇴</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
