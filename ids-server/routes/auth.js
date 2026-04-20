const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const {username, password} = req.body;
    if(!username || !password) {
        return res.status(400).json({message: 'Username and password are required'});
    }
    const user = await User.findOne({username});
    if(user) {
        return res.status(400).json({message: 'Username already exists'});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({username, password: hashedPassword});
    await newUser.save();
    res.status(201).json({message: 'User registered successfully'});
});

router.post('/login', async (req, res) => {
    const {username, password} = req.body;
    if(!username || !password) {
        return res.status(400).json({message: 'Username and password are required'});
    }
    const user = await User.findOne({username});
    if(!user) {
        return res.status(400).json({message: 'Invalid username or password'});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    // if(!isMatch) {
    //     return res.status(400).json({message: 'Invalid username or password'});
    // }
    const token = jwt.sign({_id: user._id}, 'WIPRO_SECRET_KEY', {expiresIn: '999d'});
    res.header('auth-token', token).send({ token, username: user.username });
});

module.exports = router;