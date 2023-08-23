const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();


const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');


mongoose.connect('mongodb+srv://remigranjon:wlQiVxaeVtJoJ787@cluster0.2ql35w1.mongodb.net/?retryWrites=true&w=majority',
{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>console.log('Connexion à MongoDB réussie!'))
  .catch(()=> console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

module.exports = app;