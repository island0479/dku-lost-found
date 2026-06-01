import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="auth-card">
      <div className="card">
        <div className="card-body">
          <p className="auth-title">로그인</p>
          <p className="auth-subtitle">단국대학교 구성원 전용 서비스입니다.</p>
          {error && <div className="alert-danger mb-3">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">아이디</label>
              <input type="text" className="form-control" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="form-label">비밀번호</label>
              <input type="password" className="form-control" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
                required />
            </div>
            <button type="submit" className="btn btn-dark w-100">로그인</button>
          </form>
          <p className="text-center mt-4 mb-0" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            계정이 없으신가요? <Link to="/signup" style={{ color: 'var(--brand)', fontWeight: 600 }}>회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
