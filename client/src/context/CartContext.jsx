import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

const CartContext = createContext(null);

const getSavedCart = () => {
    try {
        return JSON.parse(localStorage.getItem('compunent-rig-cart')) || [];
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(getSavedCart);

    useEffect(() => {
        localStorage.setItem(
            'compunent-rig-cart',
            JSON.stringify(cartItems)
        );
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        setCartItems(currentItems => {
            const existing = currentItems.find(
                item => item.productId === product._id
            );

            if (existing) {
                return currentItems.map(item =>
                    item.productId === product._id
                        ? {
                            ...item,
                            quantity: Math.min(
                                item.quantity + quantity,
                                product.stock
                            ),
                            stock: product.stock,
                        }
                        : item
                );
            }

            return [
                ...currentItems,
                {
                    productId: product._id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    image: product.images?.[0]?.url || '',
                    sku: product.sku,
                    stock: product.stock,
                    quantity: Math.min(quantity, product.stock),
                },
            ];
        });
    };

    const updateQuantity = (productId, quantity) => {
        setCartItems(currentItems =>
            currentItems.map(item =>
                item.productId === productId
                    ? {
                        ...item,
                        quantity: Math.min(
                            Math.max(1, quantity),
                            item.stock
                        ),
                    }
                    : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCartItems(currentItems =>
            currentItems.filter(item => item.productId !== productId)
        );
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartTotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                cartTotal,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used inside CartProvider');
    }

    return context;
};