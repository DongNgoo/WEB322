/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
*  assignment has been copied manually or electronically from any other source (including web sites) or 
*  distributed to other students.
* 
*  Name: Dong/Lynne Ngo Student ID: 129432233 Date: 2024-12-05
*
*  Vercel Web App URL: https://web-322-yf8u.vercel.app/about
*
*  GitHub Repository URL: https://github.com/DongNgoo/WEB322.git
*
********************************************************************************/ 


const express = require("express");
const storeData = require("./store-service");
const authData = require("./auth-service");
const path = require("path");
const clientSessions = require('client-sessions');
// 3 new modules, multer, cloudinary, streamifier
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const storeService = require('./store-service');
// AS4, Setup handlebars
const exphbs = require("express-handlebars");
const { Console } = require("console");

// Configure Cloudinary. This API information is
// inside of the Cloudinary Dashboard - https://console.cloudinary.com/
cloudinary.config({
  cloud_name: "Dong",
  api_key: "941578647498263",
  api_secret: "tpOdpPzIbYU-hf1EJoLIw-XP_D4",
  secure: true,
});

//  "upload" variable without any disk storage
const upload = multer(); // no { storage: storage }

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.static(__dirname + '/public'));
const session = clientSessions({
    cookieName: 'session',
    secret: 'your_secret_key_here',
    duration: 30 * 60 * 1000, // 30 minutes
    activeDuration: 5 * 60 * 1000 // 5 minutes
  });
  
  app.use(session);
  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
  });
  function ensureLogin(req, res, next) {
    if (!req.session.userName) {
      res.redirect('/login');
    } else {
      next();
    }
  }
//This will add the property "activeRoute" to "app.locals" whenever the route changes, i.e. if our route is "/store/5", the app.locals.activeRoute value will be "/store".  Also, if the shop is currently viewing a category, that category will be set in "app.locals".
app.use(function (req, res, next) {
  let route = req.path.substring(1);

  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));

  app.locals.viewingCategory = req.query.category;

  next();
});

// Handlebars Setup
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? ' class="nav-link active" '
            : ' class="nav-link" ') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      }
    },
  })
);

app.set("view engine", ".hbs");
app.set('views', __dirname + '/views');
app.get("/", (req, res) => {
    res.redirect("/about");
  });
// GET /login
app.get('/login', function(req, res) {
    res.render('login');
  });
  
  // GET /register
  app.get('/register', function(req, res) {
    res.render('register');
  });
  
  // POST /register
  app.post('/register', function(req, res) {
    authData.registerUser(req.body)
      .then(() => {
        res.render('register', { successMessage: 'User created' });
      })
      .catch((err) => {
        res.render('register', { errorMessage: err, userName: req.body.userName });
      });
  });
  
  // POST /login
  app.post('/login', function(req, res) {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
      .then((user) => {
        req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory
        };
        res.redirect('/items');
      })
      .catch((err) => {
        res.render('login', { errorMessage: err, userName: req.body.userName });
      });
  });
  
  // GET /logout
  app.get('/logout', function(req, res) {
    req.session.reset();
    res.redirect('/');
  });
  
  // GET /userHistory
  app.get('/userHistory', ensureLogin, function(req, res) {
    res.render('userHistory');
  });
// GET /categories/add
app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('addCategory');
});
// POST /categories/add
app.post('/categories/add', ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((err) => {
      res.render('addCategory', { message: 'Error adding category' });
    });
});
// GET /categories/delete/:id
app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  const id = req.params.id;
  storeService.deleteCategoryById(id)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((err) => {
      res.status(500).send('Unable to Remove Category / Category not found');
    });
});

// GET /Items/delete/:id
app.get('/Items/delete/:id', ensureLogin, (req, res) => {
  const id = req.params.id;
  storeService.deleteItemById(id)
    .then(() => {
      res.redirect('/Items');
    })
    .catch((err) => {
      res.status(500).send('Unable to Remove Item / Item not found');
    });
});


app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      console.log('categories');
      items = await storeData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeData.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;

  } 
  catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// Accept queryStrings
app.get("/items", ensureLogin, (req, res) => {
  let queryPromise = null;

  // check if there is a query for Category
  if (req.query.category) {
    // get the data for category id only.
    queryPromise = storeData.getItemsByCategory(req.query.category);
  } else if (req.query.minDate) {
    // get the data for date only.
    queryPromise = storeData.getItemsByMinDate(req.query.minDate);
  } else {
    // otherwise just get everything.
    queryPromise = storeData.getAllItems();
  }

  queryPromise
    .then((data) => {
      if(data.length > 0){
        res.render("items", { items: data });
      }
      else{
        res.render("items", { message: "no results" });
      }
    })
    .catch((err) => {
      res.render("items", { message: "no results" });
    });
});

// A route for items/add
app.get("/items/add", ensureLogin, (req, res) => {
  storeService.getCategories()
    .then((data) => {
      res.render('addItem', { categories: data });
    })
    .catch((err) => {
      res.render('addItem', { categories: [] });
    });
});

app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
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
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    // TODO: Process the req.body and add it as a new Item before redirecting to /items
    storeData
      .addItem(req.body)
      .then((post) => {
        res.redirect("/items");
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
});

// Get an individual item
app.get("/item/:id", ensureLogin, (req, res) => {
  storeData
    .getItemById(req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get("/categories", ensureLogin, (req, res) => {
  storeData
    .getCategories()
    .then((data) => {
      if(data.length > 0){
        res.render("categories", { categories: data });
      }
      else{
        res.render("categories", { message: "no results" });
      }
     
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});


app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await storeData.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await storeData.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.item = await storeData.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await storeData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", {data: viewData})
});

app.use((req, res) => {
  res.status(404).render("404");
})


  storeData.initialize()
  .then(authData.initialize)
  .then(function(){
    app.listen(HTTP_PORT, function(){
      console.log("app listening on: " + HTTP_PORT)
    });
  }).catch(function(err){
    console.log("unable to start server: " + err);
  });