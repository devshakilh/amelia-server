const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { findById, findByIdAndRemove } = require('./models/user.model')

require("dotenv").config();
app.use(cors())
app.use(express.json())



mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.w0pu2sb.mongodb.net/${process.env.DB_DATABASE}?retryWrites=true&w=majority`, {

    userNewUrlParser: true,
    useUnifiedTopology: true,

}).then(() => {
    console.log("DB CONNECTED");
}).catch(() => {
    console.log("UNABLE to connected to DB");
})






app.post('/api/register', async (req, res) => {

    try {

        const newPassword = await bcrypt.hash(req.body.password, 10)

        await User.create({
            name: req.body.name,
            email: req.body.email,

            password: newPassword,

        })
        res.json({ status: 'ok' })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Duplicate email' })
    }
})

// Login api

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({
        email: req.body.email,
    })

    if (!user) {
        return { status: 'error', error: 'Invalid login' }
    }

    const isPasswordValid = await bcrypt.compare(
        req.body.password,
        user.password
    )

    if (isPasswordValid) {
        const token = jwt.sign(
            {
                name: user.name,
                email: user.email,
            },
            'secret123'
        )

        return res.json({ status: 'ok', user: token })
    } else {
        return res.json({ status: 'error', user: false })
    }
})

app.get('/api/quote', async (req, res) => {
    const token = req.headers['x-access-token']

    try {
        const decoded = jwt.verify(token, 'secret123')
        const email = decoded.email
        const user = await User.findOne({ email: email })

        return res.json({ status: 'ok', quote: user.quote })
    } catch (error) {
        console.log(error)
        res.json({ status: 'error', error: 'invalid token' })
    }
})

app.post('/api/quote', async (req, res) => {
    const token = req.headers['x-access-token']

    try {
        const decoded = jwt.verify(token, 'secret123')
        const email = decoded.email
        await User.updateOne(
            { email: email },
            { $set: { quote: req.body.quote } }
        )

        return res.json({ status: 'ok' })
    } catch (error) {
        console.log(error)
        res.json({ status: 'error', error: 'invalid token' })
    }
})

// get user id
app.get('/user/:id', function (req, res) {
    User.findById(req.params.id)
        .then(userFound => {
            if (!userFound) {
                return res.status(404).end();
            }
            return res.status(200).json(userFound);
        })
        .catch(err => next(err));
})
app.get('/user', function (req, res) {
    User.find({}, function (err, users) {
        if (err) {
            res.send('something went wrong!');
            next();
        }
        res.json(users);
    });
})
app.post('/user', function (req, res) {
    const user = new User(req.body);
    user.save(function (err, user) {
        res.json(user);
    });
})

app.put('/user', function (req, res) {
    res.send('Got a Put request at user')
})

app.delete('/user/id', function (req, res) {
    User
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(doc => {
            if (!doc) { return res.status(400).end(); }
            return res.status(204).end();
        })
        .catch(err => next(err));
})
// server running
app.get('/', (req, res) => {
    res.send('register server is running')
})
const port = process.env.PORT || 8000
app.listen(port, () => {
    console.log('App is running at')
})


