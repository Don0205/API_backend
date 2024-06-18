const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modles/User');
const CompanyAuth = require('../modles/CompanyAuth');
const auth = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password, isAdmin, company, companyAuthCode } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // If registering as admin, validate company and auth code
        if (isAdmin) {
            if (!company || !companyAuthCode) {
                console.log(`company: ${company} ; AuthCode ${companyAuthCode}`)
                return res.status(400).json({ msg: 'Company and company auth code are required for admin registration',
                    company: company, authcode: companyAuthCode
                 });
            }

            // Validate the company auth code
            const companyAuth = await CompanyAuth.findOne({ company, code: companyAuthCode });
            if (!companyAuth) {
                console.log(`company: ${company} ; AuthCode ${companyAuthCode}`)
                return res.status(400).json({ msg: 'Invalid company or auth code' });
            }
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isAdmin,
            company: isAdmin ? company : null // Only set company if the user is an admin
        });

        await newUser.save();
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get a user
router.get('/user', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

module.exports = router;