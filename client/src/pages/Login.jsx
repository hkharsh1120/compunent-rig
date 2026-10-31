import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(formData);

            const requestedPath = location.state?.from?.pathname;

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate(requestedPath || '/');
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">

                <h1 className="mb-2 text-3xl font-bold text-white">
                    Welcome Back
                </h1>

                <p className="mb-8 text-gray-400">
                    Login to your Compunent Rig account.
                </p>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Email Address
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-semibold text-blue-400 hover:text-blue-300"
                    >
                        Register
                    </Link>
                </p>

            </div>
        </div>
    );
};

export default Login;