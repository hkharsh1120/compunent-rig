
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LogoutButton from './LogoutButton';

const Header = () => {
    const { isAuthenticated, isAdmin } = useAuth();
    const { cartCount } = useCart();

    const navClass = ({ isActive }) =>
        `text-sm font-medium transition ${
            isActive
                ? 'text-blue-400'
                : 'text-gray-300 hover:text-white'
        }`;

    return (
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950 text-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
                <Link to="/" className="text-xl font-extrabold tracking-wide">
                    COMPUNENT <span className="text-blue-500">RIG</span>
                </Link>

                <nav className="flex flex-wrap items-center gap-4 md:gap-6">
                    <NavLink to="/" className={navClass}>
                        Home
                    </NavLink>

                    <NavLink to="/products" className={navClass}>
                        Products
                    </NavLink>

                    <NavLink to="/services/pc-build" className={navClass}>
                        Custom PC
                    </NavLink>

                    <NavLink to="/services/laptop-upgrade" className={navClass}>
                        Laptop Upgrade
                    </NavLink>

                    <NavLink to="/cart" className={navClass}>
                        Cart ({cartCount})
                    </NavLink>

                    {isAuthenticated ? (
                        <>
                            <NavLink to="/account" className={navClass}>
                                Account
                            </NavLink>

                            {isAdmin && (
                                <Link
                                    to="/admin/dashboard"
                                    className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    Admin
                                </Link>
                            )}

                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-300 hover:text-white"
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
