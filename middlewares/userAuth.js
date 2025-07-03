require('dotenv').config();
const jwt = require('jsonwebtoken');

// user auth middlware
function userAuth(req, res, next) {
    const token = req.headers.token;
    if (!token) {
        res.status(401).json({
            message: 'You are not signed in!'
        })
    }
    const decodedId = jwt.verify(token, process.env.JWT_USER_SECRET);
    req.userId = decodedId.userId;
    next();
}

module.exports = {
    userAuth
}