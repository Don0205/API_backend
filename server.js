const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');

const authRoute = require('./routes/auth');
const privateRoute = require('./routes/private');
const postRoute = require('./routes/posts');


const serve = require('koa-static-folder');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());

const corsOptions = {
  origin: 'http://localhost:3000', // Adjust this to match your frontend URL
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use('/api/auth', authRoute);
app.use('/api/private', privateRoute);
app.use('/api/posts', postRoute);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Basic route
app.get('/', (req, res) => {
    res.send('Hello, this is a secure REST API!');
});


app.use(serve('./doc'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
