require('dotenv').config();
const jwt = require('jsonwebtoken');

// admin auth middlware
function adminAuth(req, res, next) {
    const token = req.headers.token;
    if (!token) {
        res.status(401).json({
            message: 'You are not signed in!'
        })
    }
    const decodedId = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    req.adminId = decodedId;
    next();
}

module.exports = {
    adminAuth
}