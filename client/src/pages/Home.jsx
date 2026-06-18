import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Countdown from '../components/Countdown';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/items').then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const timeLeft = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '2rem 20px' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Active Auctions</h2>
      {items.length === 0 ? (
        <p>No active auctions. <Link to="/create" style={{ color: '#2563eb' }}>Create one!</Link></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {items.map(item => (
            <Link to={`/items/${item._id}`} key={item._id}>
              <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '16px' }}>{item.title}</h3>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{item.category}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '1rem' }}>{item.description.substring(0, 80)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999' }}>Current bid</p>
                    <p style={{ fontSize: '20px', fontWeight: '600', color: '#2563eb' }}>₹{item.currentBid}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Time left</p>
                   <Countdown endTime={item.endTime} />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '0.5rem' }}>by {item.seller?.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
