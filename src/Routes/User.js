const express = require('express');
const router = express.Router();
const pool = require('../Config/index');
const bcrypt = require('bcrypt');
const authenticateToken = require('../Middleware/Auth');

function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Profil pengguna tidak ditemukan"
            });
        }

        const userProfile = result.rows[0];
        res.status(200).json({
            status: 200,
            message: "Profil pengguna berhasil ditemukan",
            data: userProfile
        });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});


router.post('/registration', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;


    if (!validateEmail(email)) {
        return res.status(400).json({
            status: 400,
            message: "Email tidak valid"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            status: 400,
            message: "Panjang password harus minimal 8 karakter"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query('INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *', [email, hashedPassword, first_name, last_name]);

        res.status(200).json({
            status: 0,
            message: "Registrasi berhasil",
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

router.put('/profile/update/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name } = req.body;

    try {
        const result = await pool.query('UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name) WHERE id = $3 RETURNING *', [first_name, last_name, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 404,
                message: "Pengguna tidak ditemukan"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Data pengguna berhasil diperbarui",
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});

router.put('/profile/image/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;

    if (!req.files || !req.files.profileImage) {
        return res.status(400).json({
            status: 400,
            message: "Tidak ada gambar profil yang diunggah"
        });
    }

    const profileImageFile = req.files.profileImage;

    if (!profileImageFile.mimetype.startsWith('image')) {
        return res.status(400).json({
            status: 400,
            message: "Hanya diperbolehkan mengunggah file gambar"
        });
    }

    const uploadPath = path.join(__dirname, '../uploads', profileImageFile.name);

    try {

        await profileImageFile.mv(uploadPath);

        const result = await pool.query('UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING *', [uploadPath, userId]);

        if (result.rowCount === 0) {
            fs.unlinkSync(uploadPath);
            return res.status(404).json({
                status: 404,
                message: "Pengguna tidak ditemukan"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Gambar profil berhasil diperbarui",
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating profile image', err);
        res.status(500).json({
            status: 500,
            message: "Terjadi kesalahan internal"
        });
    }
});


module.exports = router;
