/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Dong Ngo
Student ID: 129432233
Date: 2024/10/14
Vercel Web App URL: https://web-322-demo.vercel.app/
GitHub Repository URL: git@github.com:DongNgoo/WEB322.git

********************************************************************************/ 

const storeService = require('./store-service.js');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the "public" folder
app.use(express.static('public'));

// Redirect root to "/about"
app.get('/', (req, res) => {
    res.redirect('/about');
});

// Serve the about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});
app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});


app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});


app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});


app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

storeService.initialize()
    .then(() => {
        app.listen(8080, () => {
            console.log('Server started on http://localhost:8080');
        });
    })
    .catch((err) => {
        console.error(`Failed to start server: ${err}`);
    });