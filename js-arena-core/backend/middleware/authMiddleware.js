const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Since we'll store JWT in httpOnly cookie, check cookies or Authorization header
    // Note: the prompt says JWT stored in httpOnly cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
        // Basic parser for cookies
        const cookies = req.headers.cookie.split(';');
        for (let c of cookies) {
            if (c.trim().startsWith('js_arena_token=')) {
                token = c.trim().split('=')[1];
            }
        }
    }

    if (!token) {
        console.log('❌ Auth failed: No token found in header or cookie');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const secret = process.env.JSARENA_JWT_SECRET;
        console.log(`🔐 Verifying token using secret (first 5 chars): ${secret ? secret.substring(0, 5) : 'MISSING'}...`);
        const decoded = jwt.verify(token, secret);
        console.log(`✅ Token verified for decoded id: ${decoded.id}`);
        req.user = await User.findById(decoded.id).select('-password').populate('badges');
        if (!req.user) {
            console.log('❌ Auth failed: User not found in JSArena DB');
            return res.status(401).json({ message: 'User not found' });
        }
        console.log(`✅ Auth successful: User ${req.user.username} (id: ${req.user._id}) found`);
        next();
    } catch (error) {
        console.log('❌ Auth failed: Token verification error:', error.message);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
