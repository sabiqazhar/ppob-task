const express = require('express');
const router = express.Router();
const pool = require('../Config/index');
const authenticateToken = require('../Middleware/Auth');

router.get('/banner', authenticateToken,  async (req, res) => {
    try {
        const result = await pool.query('SELECT banner_name, banner_image, description FROM banner')
        const success = {
            "status": 200,
            "message": "sukses",
            "data": result.rows
        };
        res.status(200).json(success);
    } catch (err) {
        const fail = {
            "status": 200,
            "message": "Terjadi kesalahan internal",
            "data": []
        };
        console.error('Error executing query', err);
        res.status(500).json(fail);
    }
});

module.exports = router;
