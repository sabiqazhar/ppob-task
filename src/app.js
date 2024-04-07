const express = require('express');
const cors = require('cors');
const serviceRoutes = require('./Routes/Service');
const bannerRoutes = require('./Routes/Banner');
const authRoutes = require('./Routes/Auth');
const userRoutes = require('./Routes/User');
const transactionRoutes = require('./Routes/Transaction');
const app = express();
const port = 8000;


//middleware
app.use(cors());
app.use(express.json());

//testing
app.get('/', (req, res) => {
    res.send('hellow buddy')
});

//v1 app route
app.use('/v1', serviceRoutes);
app.use('/v1', bannerRoutes);
app.use('/v1', authRoutes);
app.use('/v1', userRoutes);
app.use('/v1', transactionRoutes);

app.listen(port, () => {
    console.log(`server has running at port ${port}`);
});