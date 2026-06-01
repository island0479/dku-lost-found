import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function ItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', location: '', found_date: '', description: '' });
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user === null) { navigate('/login'); return; }
    api.get('/categories/').then(r => setCategories(r.data));
    if (isEdit) {
      api.get(`/items/${id}/`).then(r => {
        const { title, category, location, found_date, description, images } = r.data;
        setForm({ title, category: category || '', location, found_date, description });
        setExistingImages(images || []);
      });
    }
  }, [id, user]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setNewImages(files);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    newImages.forEach(f => fd.append('images', f));
    try {
      if (isEdit) {
        await api.put(`/items/${id}/`, fd);
        navigate(`/item/${id}`);
      } else {
        const r = await api.post('/items/', fd);
        navigate(`/item/${r.data.id}`);
      }
    } catch (err) {
      setErrors(err.response?.data || {});
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card">
          <div className="card-body p-4">
            <h4 className="fw-bold mb-4">분실물 {isEdit ? '수정' : '등록'}</h4>
            <form onSubmit={handleSubmit}>
              {[
                { name: 'title', label: '제목', type: 'text' },
                { name: 'location', label: '발견 장소', type: 'text' },
                { name: 'found_date', label: '발견 날짜', type: 'date' },
              ].map(({ name, label, type }) => (
                <div key={name} className="mb-3">
                  <label className="form-label">{label}</label>
                  <input type={type} name={name} className="form-control"
                    value={form[name]} onChange={handleChange} required />
                  {errors[name] && <div style={{ color: '#D92B2B', fontSize: '0.8rem' }} className="mt-1">{errors[name]}</div>}
                </div>
              ))}

              <div className="mb-3">
                <label className="form-label">카테고리</label>
                <select name="category" className="form-select"
                  value={form.category} onChange={handleChange}>
                  <option value="">선택 안 함</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">설명</label>
                <textarea name="description" className="form-control" rows={4}
                  value={form.description} onChange={handleChange} />
              </div>

              <div className="mb-4">
                <label className="form-label">사진</label>
                {isEdit && existingImages.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {existingImages.map((url, i) => (
                      <img key={i} src={url} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--border)' }} alt="" />
                    ))}
                    <div className="w-100">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        새 사진을 추가하면 기존 사진에 추가됩니다.
                      </span>
                    </div>
                  </div>
                )}
                <input type="file" className="form-control" accept="image/*" multiple
                  onChange={handleImageChange} />
                {newImages.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {newImages.map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--brand)' }} alt="" />
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-dark">{isEdit ? '저장' : '등록'}</button>
                <button type="button" className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
