const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({
            status: 401,
            message: "Token tidak tersedia"
        });
    }

    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({
                status: 403,
                message: "Token tidak valid atau kadaluwarsa"
            });
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;