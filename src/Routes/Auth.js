const express = require('express');
const router = express.Router();
const pool = require('../Config/index');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 404,
                message: "Email atau password salah"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                status: 401,
                message: "Email atau password salah"
            });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, 'secret_key', { expiresIn: '1h' });

        res.status(200).json({
            status: 200,
            message: "Login berhasil",
            token: token
        });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});

module.exports = router;
