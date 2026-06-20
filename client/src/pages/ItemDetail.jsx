import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import socket from '../utils/socket';
import { toast } from 'react-toastify';
import Countdown from '../components/Countdown';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const getMinIncrement = (currentBid) => {
  if (currentBid < 500) return 50;
  if (currentBid < 2000) return 100;
  if (currentBid < 10000) return 250;
  return 500;
};
  const [maxBudget, setMaxBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/items/${id}`),
      api.get(`/bids/${id}`)
    ]).then(([itemRes, bidsRes]) => {
      setItem(itemRes.data);
      setBids(bidsRes.data);
      setLoading(false);
    });

    socket.emit('join_item', id);

    socket.on('bid_placed', (data) => {
      setItem(prev => ({ ...prev, currentBid: data.amount, currentWinner: data.bidder }));
      setBids(prev => [{
        _id: Date.now(),
        bidder: data.bidder,
        amount: data.amount,
        isAutoBid: data.isAutoBid,
        createdAt: data.timestamp
      }, ...prev]);
      if (user && data.bidder._id !== user._id) {
        toast.info(`New bid: ₹${data.amount} by ${data.bidder.name}`);
      }
      if (data.isAutoBid) {
        toast.info(`Auto-bid placed: ₹${data.amount}`);
      }
    });

    return () => {
      socket.emit('leave_item', id);
      socket.off('bid_placed');
    };
  }, [id, user]);

  const handleBid = async () => {
    if (!user) return toast.error('Please login to bid');
    if (!bidAmount) return toast.error('Enter a bid amount');
    setBidding(true);
    try {
      await api.post('/bids', { itemId: id, amount: Number(bidAmount) });
      toast.success('Bid placed!');
      setBidAmount('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bid failed');
    } finally {
      setBidding(false);
    }
  };

  const handleAutoBid = async () => {
    if (!user) return toast.error('Please login');
    if (!maxBudget) return toast.error('Enter max budget');
    try {
      await api.post('/bids/autobid', { itemId: id, maxBudget: Number(maxBudget) });
      toast.success(`Auto-bid set! Max: ₹${maxBudget}`);
      setMaxBudget('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const timeLeft = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Auction ended';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m remaining`;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  if (!item) return <div style={{ textAlign: 'center', padding: '4rem' }}>Item not found</div>;

  return (
    <div className="container" style={{ padding: '2rem 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        <div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '4px', fontSize: '12px' }}>{item.category}</span>
              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: '4px', fontSize: '12px' }}>{item.condition}</span>
            </div>
            <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>{item.title}</h1>
            <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '1.5rem' }}>{item.description}</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Listed by <strong>{item.seller?.name}</strong></p>
            <div style={{ marginTop: '8px' }}>
             <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Time remaining</p>
             <Countdown endTime={item.endTime} onExpire={() => setItem(prev => ({ ...prev, isActive: false }))} />
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', marginTop: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Bid History</h3>
            {bids.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>No bids yet. Be the first!</p>
            ) : (
              bids.map((bid, i) => (
                <div key={bid._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < bids.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{bid.bidder?.name}</span>
                    {bid.isAutoBid && <span style={{ fontSize: '11px', color: '#8b5cf6', marginLeft: '6px', background: '#f5f3ff', padding: '1px 6px', borderRadius: '3px' }}>auto</span>}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#2563eb' }}>₹{bid.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: '80px' }}>
            <p style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>Current bid</p>
            <p style={{ fontSize: '36px', fontWeight: '700', color: '#2563eb', marginBottom: '1.5rem' }}>₹{item.currentBid}</p>
            {item.isActive ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                    Your bid (min ₹{item.currentBid + getMinIncrement(item.currentBid)})
                  </label>
                  <input
                   type="number"
                   value={bidAmount}
                   onChange={e => setBidAmount(e.target.value)}
                   min={item.currentBid + getMinIncrement(item.currentBid)}
                   step={getMinIncrement(item.currentBid)}
                   style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                  />
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                   Bids increase in steps of ₹{getMinIncrement(item.currentBid)}
                  </p>
                </div>
                <button onClick={handleBid} disabled={bidding} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', cursor: 'pointer', marginBottom: '1.5rem' }}>
                  {bidding ? 'Placing...' : 'Place Bid'}
                </button>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1.5rem' }}>
                  <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Auto-bid</p>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Set a max budget — we'll bid automatically for you</p>
                  <input type="number" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} placeholder="Max budget" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', marginBottom: '8px' }} />
                  <button onClick={handleAutoBid} style={{ width: '100%', padding: '10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                    Activate Auto-bid
                  </button>
                </div>
              </>
            ) : (
              <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontWeight: '500' }}>Auction Ended</p>
                {item.currentWinner && <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Won by {item.currentWinner.name}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
