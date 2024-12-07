const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

const User = mongoose.model('User', userSchema);

let db;
module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    mongoose.connect('mongodb+srv://dngo13:Ngo9Dong@cluster0.xkeyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
      .then((conn) => {
        db = conn;
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.registerUser = function(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt.hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;
          let newUser = new User(userData);
          newUser.save()
            .then((result) => {
              resolve(result);
            })
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch((err) => {
          reject("There was an error encrypting the password: " + err);
        });
    }
  });
};

module.exports.checkUser = function(userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject("Unable to find user: " + userData.userName);
        } else {
          bcrypt.compare(userData.password, user.password)
            .then((result) => {
              if (result) {
                user.loginHistory.push({
                  dateTime: (new Date()).toISOString(),
                  userAgent: userData.userAgent
                });
                User.updateOne({ userName: user.userName }, { $set: { loginHistory: user.loginHistory } })
                  .then(() => {
                    resolve(user);
                  })
                  .catch((err) => {
                    reject("There was an error updating the user's login history: " + err);
                  });
              } else {
                reject("Incorrect Password for user: " + userData.userName);
              }
            })
            .catch((err) => {
              reject("There was an error verifying the user: " + err);
            });
        }
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};