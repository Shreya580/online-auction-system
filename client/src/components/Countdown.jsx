import { useState, useEffect } from 'react';

export default function Countdown({ endTime, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime));

  function getTimeLeft(end) {
    const diff = new Date(end) - new Date();
    if (diff <= 0) return null;
    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds, diff };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const t = getTimeLeft(endTime);
      setTimeLeft(t);
      if (!t && onExpire) onExpire();
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (!timeLeft) return (
    <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>Auction Ended</span>
  );

  const isUrgent = timeLeft.diff < 3600000; // under 1 hour

  const box = (val, label) => (
    <div style={{ textAlign: 'center', minWidth: '44px' }}>
      <div style={{
        fontSize: '20px', fontWeight: '700',
        color: isUrgent ? '#ef4444' : '#1e40af',
        background: isUrgent ? '#fef2f2' : '#eff6ff',
        borderRadius: '6px', padding: '4px 8px', lineHeight: 1.2
      }}>
        {String(val).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
      {timeLeft.days > 0 && box(timeLeft.days, 'days')}
      {box(timeLeft.hours, 'hrs')}
      {box(timeLeft.minutes, 'min')}
      {box(timeLeft.seconds, 'sec')}
    </div>
  );
}
