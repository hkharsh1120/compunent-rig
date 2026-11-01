import { NavLink, Outlet, Link } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';

const navigation = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Products', path: '/admin/products' },
    { name: 'Inventory', path: '/admin/inventory' },
    { name: 'Categories & Brands', path: '/admin/catalog' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Coupons', path: '/admin/coupons' },
    { name: 'Service Requests', path: '/admin/service-requests' },
    { name: 'Customers', path: '/admin/customers' },
];

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100 md:flex">
            <aside className="w-full bg-gray-900 p-5 text-white md:min-h-screen md:w-64">
                <Link to="/admin/dashboard" className="text-2xl font-bold">
                    Compunent Rig
                </Link>

                <p className="mb-6 mt-1 text-sm text-gray-400">
                    Administration Panel
                </p>

                <nav className="space-y-2">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `block rounded-lg px-4 py-3 text-sm transition ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800'
                                }`
                            }
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-8 border-t border-gray-700 pt-5">
                    <Link
                        to="/"
                        className="mb-4 block text-sm text-gray-300 hover:text-white"
                    >
                        Visit Website
                    </Link>

                    <LogoutButton />
                </div>
            </aside>

            <main className="min-w-0 flex-1 p-5 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;