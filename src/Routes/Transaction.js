const express = require('express');
const router = express.Router();
const pool = require('../Config/index');
const authenticateToken = require('../Middleware/Auth');

function generateInvoice(length) {
    let result = 'INV';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Profil pengguna tidak ditemukan"
            });
        }

        const balanceUser = result.rows[0];
        res.status(200).json({
            status: 0,
            message: "Get Balance Berhasil",
            data: balanceUser
        });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});


router.post('/topup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { top_up_amount } = req.body;

        if (top_up_amount < 0 || isNaN(top_up_amount)){
            return res.status(500).json({
                status: 102,
                message: "Parameter amount hanya boleh angka dan tidak boleh lebih kecil dari 0"
            });
        }

        const balance = await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING *', [top_up_amount, userId]);
        const transaction = await pool.query('INSERT INTO transactions (user_id, invoice_number, transaction_type, description, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, generateInvoice(8), "TOPUP", "Top Up balance", top_up_amount]);

        res.status(200).json({
            status: 0,
            message: "Top up Balance Berhasil",
            data: null
        });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});

router.post('/transaction', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { service_code } = req.body;

        const selectedQuery = `
            WITH selected_service AS (
                SELECT service_name, service_tarif FROM services WHERE service_code = $1
            ),
            user_balance AS (
                SELECT balance FROM users WHERE id = $2
            )
            SELECT * FROM selected_service, user_balance;
        `;
        const { rows } = await pool.query(selectedQuery, [service_code, userId]);

        if (rows.length === 0 || rows[0].service_name === null) {
            return res.status(404).json({
                status: 404,
                message: "Layanan tidak ditemukan"
            });
        }

        if (rows[0].balance > rows[0].service_tarif){
            return res.status(404).json({
                status: 404,
                message: "Balance anda tidak mencukupi, silahkan TOPUP"
            });
        }

        const balance = await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING *', [rows[0].service_tarif, userId]);
        const transaction = await pool.query('INSERT INTO transactions (user_id, invoice_number, transaction_type, description, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, generateInvoice(8), "PAYMENT", rows[0].service_name, rows[0].service_tarif]);

        res.status(200).json({
            status: 200,
            message: "Transaksi berhasil",
            data: null
        });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});

router.get('/transaction/history', authenticateToken, async (req, res) => {
    try {
        let { limit, offset } = req.query;
        const userId = req.user.userId;

        if (!limit) {
            limit = 3;
        }
        if (!offset) {
            offset = 0;
        }

        limit = parseInt(limit);
        offset = parseInt(offset);

        const transactionQuery = `
            SELECT 
                transactions.invoice_number, 
                transactions.transaction_type, 
                transactions.description, 
                transactions.total_amount, 
                transactions.created_at 
            FROM transactions 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;
        const transaction = await pool.query(transactionQuery, [userId, limit, offset]);

        res.status(200).json({
            status: 200,
            message: "Berhasil mengambil riwayat transaksi",
            data: {
                offset: offset,
                limit: limit,
                transactions: transaction.rows
            }
        });
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});


module.exports = router;