import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { getHealthStatus } from './services/healthService';

function Home() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const data = await getHealthStatus();
                setHealth(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to connect to backend'
                );
            } finally {
                setLoading(false);
            }
        };

        checkBackend();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-bold mb-3">
                COMPUNENT RIG
            </h1>

            <p className="text-slate-400 mb-8">
                Computer Hardware & Custom Builds
            </p>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                    System Status
                </h2>

                {loading && (
                    <p className="text-yellow-400">
                        Checking backend connection...
                    </p>
                )}

                {error && (
                    <p className="text-red-400">
                        {error}
                    </p>
                )}

                {health && (
                    <div className="space-y-3">
                        <p className="text-green-400">
                            Backend: Connected
                        </p>

                        <p className={
                            health.database === 'Connected'
                                ? 'text-green-400'
                                : 'text-red-400'
                        }>
                            Database: {health.database}
                        </p>

                        <p className="text-slate-400 text-sm">
                            {health.message}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-3xl font-bold">
                404 - Page Not Found
            </h1>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;