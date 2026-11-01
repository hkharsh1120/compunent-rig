
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/productService';

const Home = () => {
    const [products, setProducts] = useState([]);
const [loadingProducts, setLoadingProducts] = useState(true);
const [productError, setProductError] = useState('');

useEffect(() => {
    const loadProducts = async () => {
        try {
            const result = await getProducts({ limit: 4 });

            const productList = Array.isArray(result)
                ? result
                : result?.products || result?.items || [];

            setProducts(productList.slice(0, 4));
        } catch (error) {
            console.error('Failed to load homepage products:', error);
            setProductError('Unable to load products right now.');
        } finally {
            setLoadingProducts(false);
        }
    };

    loadProducts();
}, []);
    return (
        <main className="bg-white text-gray-900">

            {/* Hero */}
            <section className="bg-gray-950 text-white">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">

                    <div>
                        <p className="mb-4 font-semibold uppercase tracking-widest text-blue-400">
                            Computer Hardware & Technology
                        </p>

                        <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
                            Build Your
                            <span className="text-blue-500"> Perfect </span>
                            Setup.
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
                            Discover quality computer components, build your
                            dream PC, and upgrade your laptop with help from
                            Compunent Rig.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                to="/products"
                                className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700"
                            >
                                Explore Products
                            </Link>

                            <Link
                                to="/services/pc-build"
                                className="rounded-lg border border-gray-600 px-7 py-3 font-semibold hover:bg-gray-800"
                            >
                                Build Custom PC
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                            Compunent Rig
                        </p>

                        <h2 className="mt-4 text-3xl font-bold">
                            Your Hardware. Your Choice.
                        </h2>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {[
                                'Processors',
                                'Graphics Cards',
                                'Motherboards',
                                'RAM & Storage',
                                'Power Supplies',
                                'PC Accessories',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-lg bg-gray-800 p-4 text-sm font-medium text-gray-200"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-10 text-center">
                    <p className="font-semibold uppercase tracking-widest text-blue-600">
                        What We Offer
                    </p>

                    <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                        More Than Just Hardware
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                        Get the right components and professional guidance
                        for your computer needs.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border p-8 transition hover:shadow-lg">
                        <div className="mb-5 text-4xl">🖥️</div>

                        <h3 className="text-2xl font-bold">
                            Custom PC Building
                        </h3>

                        <p className="mt-3 leading-relaxed text-gray-600">
                            Gaming PC, editing workstation, programming
                            setup or office computer. Tell us your budget
                            and requirements.
                        </p>

                        <Link
                            to="/services/pc-build"
                            className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
                        >
                            Request a Custom Build →
                        </Link>
                    </div>

                    <div className="rounded-2xl border p-8 transition hover:shadow-lg">
                        <div className="mb-5 text-4xl">💻</div>

                        <h3 className="text-2xl font-bold">
                            Laptop Upgrades
                        </h3>

                        <p className="mt-3 leading-relaxed text-gray-600">
                            Improve your laptop with compatible RAM and
                            storage upgrades. We check your model before
                            recommending components.
                        </p>

                        <Link
                            to="/services/laptop-upgrade"
                            className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
                        >
                            Request an Upgrade →
                        </Link>
                    </div>
                </div>
            </section>
            {/* Featured Products */}
<section className="bg-gray-950 px-6 py-20">
    <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="font-semibold uppercase tracking-widest text-blue-400">
                    Our Collection
                </p>

                <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                    Featured Products
                </h2>

                <p className="mt-3 text-gray-400">
                    Explore quality components for your next setup.
                </p>
            </div>

            <Link
                to="/products"
                className="font-semibold text-blue-400 hover:text-blue-300"
            >
                View All Products →
            </Link>
        </div>

        {loadingProducts ? (
            <p className="py-12 text-center text-gray-400">
                Loading products...
            </p>
        ) : productError ? (
            <p className="py-12 text-center text-red-400">
                {productError}
            </p>
        ) : products.length === 0 ? (
            <div className="rounded-xl border border-gray-800 py-12 text-center">
                <p className="text-lg font-semibold text-white">
                    No products available yet.
                </p>
                <p className="mt-2 text-gray-400">
                    Check back soon for new computer components.
                </p>
            </div>
        ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                    <ProductCard
                        key={product._id || product.id}
                        product={product}
                    />
                ))}
            </div>
        )}

    </div>
</section>

            {/* Shopping CTA */}
            <section className="bg-gray-100 px-6 py-20">
                <div className="mx-auto max-w-7xl text-center">
                    <h2 className="text-3xl font-bold md:text-4xl">
                        Find the Right Components
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                        Explore our computer hardware catalogue and find
                        components for your next build.
                    </p>

                    <Link
                        to="/products"
                        className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        Browse All Products
                    </Link>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="mx-auto max-w-7xl px-6 py-20">
                <h2 className="mb-10 text-center text-3xl font-bold">
                    Why Choose Compunent Rig?
                </h2>

                <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            title: 'Component Guidance',
                            description: 'Get help choosing suitable hardware for your needs.',
                        },
                        {
                            title: 'Custom PC Solutions',
                            description: 'Plan a computer build around your requirements and budget.',
                        },
                        {
                            title: 'Upgrade Assistance',
                            description: 'Get help finding compatible laptop RAM and storage upgrades.',
                        },
                    ].map((item) => (
                        <div key={item.title} className="rounded-xl bg-gray-50 p-7">
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <p className="mt-3 text-gray-600">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 px-6 py-10 text-white">
                <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-8">
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            COMPUNENT RIG
                        </h2>

                        <p className="mt-3 text-sm text-gray-400">
                            Computer Hardware & Custom Builds.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Quick Links</h3>

                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-400">
                            <Link to="/products">Products</Link>
                            <Link to="/services/pc-build">Custom PC Build</Link>
                            <Link to="/services/laptop-upgrade">Laptop Upgrade</Link>
                            <Link to="/account">My Account</Link>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-10 max-w-7xl border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Compunent Rig. All rights reserved.
                </div>
            </footer>
        </main>
    );
};

export default Home;
