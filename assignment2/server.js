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

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { addItem } = require('./store-service');

 // No { storage: storage } needed


const storeService = require('./store-service.js');
const express = require('express');
const path = require('path');
const router = express.Router();

const app = express();
const PORT = process.env.PORT || 8080;
cloudinary.config({
    cloud_name: 'dywnbz31i',
    api_key: '941578647498263',
    api_secret: 'tpOdpPzIbYU-hf1EJoLIw-XP_D4',
    secure: true
});
const upload = multer();
// GET /items route
router.get('/items', async (req, res) => {
    const { category, minDate } = req.query;

    try {
        let items;

        if (category) {
            // If category is provided, get items by category
            items = await storeService.getItemsByCategory(category);
        } else if (minDate) {
            // If minDate is provided, get items by minDate
            items = await storeService.getItemsByMinDate(minDate);
        } else {
            // If no filters, return all items
            items = await storeService.getAllItems(); // Assume this exists
        }

        // Return the items as a JSON response
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error("Upload failed:", err);
            res.status(500).send("Failed to upload image.");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        // Use addItem function from store-service.js
        addItem(req.body).then((newItem) => {
            console.log("Item added:", newItem);
            res.redirect("/items"); // Redirect to items page after adding the item
        }).catch((err) => {
            console.error("Failed to add item:", err);
            res.status(500).send("Failed to add item.");
        });
    }
});


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

app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
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