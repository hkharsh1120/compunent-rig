const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_JWT_EXPIRES_IN = '7d';

// Single source of truth for token lifetime. The JWT and the auth cookie
// both derive their expiry from JWT_EXPIRES_IN.
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;

const UNIT_TO_MS = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
};

// Convert a jsonwebtoken-style duration ("7d", "12h", "30m", 3600) to ms.
const durationToMs = (duration) => {
    if (typeof duration === 'number' && Number.isFinite(duration)) {
        return duration * 1000;
    }

    const match = String(duration)
        .trim()
        .match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)?$/i);

    if (!match) {
        return UNIT_TO_MS.d * 7;
    }

    const amount = Number(match[1]);
    const unit = (match[2] || 's').toLowerCase();

    return Math.round(amount * UNIT_TO_MS[unit]);
};

// maxAge is kept separate from cookieOptions so clearCookie() does not
// accidentally inherit a future expiry.
const cookieMaxAge = durationToMs(jwtExpiresIn);

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
};

module.exports = {
    cookieOptions,
    cookieMaxAge,
    jwtExpiresIn,
};
