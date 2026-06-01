import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password1: '', password2: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const r = await api.post('/auth/signup/', form);
      setUser(r.data);
      navigate('/');
    } catch (err) {
      setErrors(err.response?.data || {});
    }
  };

  const fields = [
    { name: 'username', label: '아이디', type: 'text' },
    { name: 'email', label: '학교 이메일', type: 'email', hint: '@dankook.ac.kr 이메일만 사용 가능합니다.' },
    { name: 'password1', label: '비밀번호', type: 'password' },
    { name: 'password2', label: '비밀번호 확인', type: 'password' },
  ];

  return (
    <div className="auth-card">
      <div className="card">
        <div className="card-body">
          <p className="auth-title">회원가입</p>
          <p className="auth-subtitle">단국대학교 구성원 전용 서비스입니다.</p>
          <form onSubmit={handleSubmit}>
            {fields.map(({ name, label, type, hint }) => (
              <div key={name} className="mb-3">
                <label className="form-label">{label}</label>
                <input type={type} className="form-control"
                  value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })} required />
                {hint && <div className="form-text mt-1">{hint}</div>}
                {errors[name] && (
                  <div className="mt-1" style={{ color: '#D92B2B', fontSize: '0.8rem' }}>
                    {Array.isArray(errors[name]) ? errors[name][0] : errors[name]}
                  </div>
                )}
              </div>
            ))}
            <button type="submit" className="btn btn-dark w-100 mt-2">가입하기</button>
          </form>
          <p className="text-center mt-4 mb-0" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            이미 계정이 있으신가요? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
