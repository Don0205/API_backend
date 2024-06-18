const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, (req, res) => {
    res.send('This is a protected route');

    
});

module.exports = router;
