import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';

const Account = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-950 px-4 py-12 text-white">
            <div className="mx-auto max-w-3xl rounded-2xl border border-gray-800 bg-gray-900 p-8">

                <h1 className="mb-6 text-3xl font-bold">
                    My Account
                </h1>
                <Link
    to="/account/orders"
    className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
>
    My Orders
</Link>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-400">Full Name</p>
                        <p className="font-medium">{user?.name}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="font-medium">{user?.email}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400">Account Type</p>
                        <p className="font-medium capitalize">{user?.role}</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        to="/"
                        className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
                    >
                        Back to Home
                    </Link>

                    <LogoutButton />
                </div>

            </div>
        </div>
    );
};

export default Account;