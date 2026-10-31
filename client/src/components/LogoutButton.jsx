import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LogoutButton = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);

        try {
            await logout();
            navigate('/login', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
        >
            {loading ? 'Logging out...' : 'Logout'}
        </button>
    );
};

export default LogoutButton;