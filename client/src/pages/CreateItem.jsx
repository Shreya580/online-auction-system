import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function CreateItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', condition: 'good',
    startingPrice: '', endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Fetch price prediction whenever category, condition, or a default age changes
  useEffect(() => {
    if (!form.category || !form.condition) return;

    const timeout = setTimeout(async () => {
      setPredicting(true);
      try {
        const { data } = await api.get('/items/predict-price', {
          params: { category: form.category, condition: form.condition, age: 1 }
        });
        setPrediction(data);
      } catch {
        setPrediction(null);
      } finally {
        setPredicting(false);
      }
    }, 600); // debounce — wait 600ms after user stops typing

    return () => clearTimeout(timeout);
  }, [form.category, form.condition]);

  if (!user || user.role !== 'seller') {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Only sellers can create listings.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/items', {
        ...form,
        startingPrice: Number(form.startingPrice)
      });
      toast.success('Listing created!');
      navigate(`/items/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const applyPrediction = () => {
    if (prediction) {
      setForm(f => ({ ...f, startingPrice: prediction.suggestedPrice }));
      toast.success('Price applied!');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 20px', maxWidth: '620px' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Create Listing</h2>
      <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                <option value="">Select...</option>
                {['Electronics','Furniture','Clothing','Books','Antiques','Sports','Art'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Condition</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          {/* AI Price Suggestion */}
          {(prediction || predicting) && (
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#6d28d9', fontWeight: '600', marginBottom: '2px' }}>🤖 AI Price Suggestion</p>
                  {predicting ? (
                    <p style={{ fontSize: '13px', color: '#7c3aed' }}>Calculating...</p>
                  ) : (
                    <p style={{ fontSize: '18px', fontWeight: '700', color: '#4c1d95' }}>
                      ₹{prediction.suggestedPrice}
                      <span style={{ fontSize: '13px', fontWeight: '400', color: '#7c3aed', marginLeft: '8px' }}>
                        (range: ₹{prediction.priceRange.low} – ₹{prediction.priceRange.high})
                      </span>
                    </p>
                  )}
                </div>
                {prediction && !predicting && (
                  <button type="button" onClick={applyPrediction}
                    style={{ padding: '6px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    Use this
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Starting Price (₹)</label>
            <input type="number" value={form.startingPrice} onChange={e => setForm({ ...form, startingPrice: e.target.value })} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Auction End Time</label>
            <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', cursor: 'pointer' }}>
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}