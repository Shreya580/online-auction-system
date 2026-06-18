import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Countdown from '../components/Countdown';

export default function Dashboard() {
  const { user } = useAuth();
  const [myBids, setMyBids]       = useState([]);
  const [myItems, setMyItems]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState(user?.role === 'seller' ? 'listings' : 'bids');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/bids/my'),
      api.get('/items/my')
    ]).then(([bidsRes, itemsRes]) => {
      setMyBids(bidsRes.data);
      setMyItems(itemsRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p>Please <Link to="/login" style={{ color: '#2563eb' }}>login</Link> to view your dashboard.</p>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

  const tab = (id, label, count) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding: '8px 20px', fontSize: '14px', fontWeight: activeTab === id ? '600' : '400',
      border: 'none', borderBottom: activeTab === id ? '2px solid #2563eb' : '2px solid transparent',
      background: 'none', color: activeTab === id ? '#2563eb' : '#6b7280',
      cursor: 'pointer', transition: 'all 0.15s'
    }}>
      {label} {count > 0 && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '10px', marginLeft: '4px' }}>{count}</span>}
    </button>
  );

  return (
    <div className="container" style={{ padding: '2rem 20px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Hi, {user.name} 👋</h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Role: {user.role}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Bids Placed', value: myBids.length, color: '#2563eb' },
          { label: 'Active Auctions Won', value: myBids.filter(b => b.item?.currentWinner?._id === user._id && b.item?.isActive).length, color: '#16a34a' },
          { label: user.role === 'seller' ? 'My Listings' : 'Items Watching', value: myItems.length, color: '#7c3aed' }
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid #f0f0f0', padding: '0 1.5rem', display: 'flex', gap: '0' }}>
          {tab('bids', 'My Bids', myBids.length)}
          {user.role === 'seller' && tab('listings', 'My Listings', myItems.length)}
        </div>

        <div style={{ padding: '1.5rem' }}>

          {/* My Bids */}
          {activeTab === 'bids' && (
            myBids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</p>
                <p>You haven't placed any bids yet.</p>
                <Link to="/" style={{ color: '#2563eb', fontSize: '14px' }}>Browse auctions →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myBids.map(bid => {
                  const isWinning = bid.item?.currentWinner?._id === user._id;
                  return (
                    <Link to={`/items/${bid.item?._id}`} key={bid._id} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', transition: 'border-color 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                        onMouseOut={e => e.currentTarget.style.borderColor = '#f0f0f0'}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>{bid.item?.title || 'Item deleted'}</p>
                          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                            Your bid: <strong style={{ color: '#2563eb' }}>₹{bid.amount}</strong>
                            {bid.isAutoBid && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#f5f3ff', color: '#7c3aed', padding: '1px 6px', borderRadius: '3px' }}>auto</span>}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                            background: isWinning ? '#f0fdf4' : '#fef2f2',
                            color: isWinning ? '#16a34a' : '#ef4444'
                          }}>
                            {isWinning ? '🏆 Winning' : 'Outbid'}
                          </span>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            Current: ₹{bid.item?.currentBid}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {/* My Listings */}
          {activeTab === 'listings' && (
            myItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>📦</p>
                <p>You haven't listed anything yet.</p>
                <Link to="/create" style={{ color: '#2563eb', fontSize: '14px' }}>Create a listing →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myItems.map(item => (
                  <Link to={`/items/${item._id}`} key={item._id} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', transition: 'border-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#f0f0f0'}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>{item.title}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          {item.category} · {item.condition}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>₹{item.currentBid}</p>
                        <div style={{ marginTop: '4px' }}>
                          {item.isActive
                            ? <Countdown endTime={item.endTime} />
                            : <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>Ended</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
