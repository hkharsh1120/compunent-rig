import { Link, useLocation } from 'react-router-dom';

const OrderSuccess = () => {
    const location = useLocation();
    const order = location.state?.order;

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-white">
            <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">

                <div className="mb-5 text-5xl">✓</div>

                <h1 className="text-3xl font-bold">
                    Order Submitted!
                </h1>

                <p className="mt-3 text-gray-400">
                    Thank you for choosing Compunent Rig. Your order has been
                    submitted successfully.
                </p>

                {order && (
                    <div className="mt-6 rounded-xl bg-gray-800 p-5 text-left">
                        <p className="text-sm text-gray-400">Order Number</p>

                        <p className="mt-1 font-semibold">
                            {order.orderNumber}
                        </p>

                        <p className="mt-4 text-sm text-gray-400">Total Amount</p>

                        <p className="mt-1 text-xl font-bold">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                        </p>

                        <p className="mt-4 text-sm text-gray-400">Status</p>

                        <p className="mt-1 capitalize">
                            {order.orderStatus}
                        </p>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3">
                    <Link
                        to="/account"
                        className="rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700"
                    >
                        My Account
                    </Link>

                    <Link
                        to="/products"
                        className="rounded-lg border border-gray-700 py-3 hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>
                </div>

            </div>
        </main>
    );
};

export default OrderSuccess;