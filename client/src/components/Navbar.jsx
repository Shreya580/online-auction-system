import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        <Link to="/" style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
          BidHub
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '14px', color: '#555' }}>Auctions</Link>
          {user?.role === 'seller' && (
            <Link to="/create" style={{ fontSize: '14px', color: '#555' }}>+ List Item</Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" style={{ fontSize: '14px', color: '#555' }}>Hi, {user.name}</Link>
              <button onClick={handleLogout} style={{ fontSize: '14px', padding: '6px 14px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: '14px', color: '#555' }}>Login</Link>
              <Link to="/register" style={{ fontSize: '14px', padding: '6px 14px', background: '#2563eb', color: 'white', borderRadius: '4px' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
