require('pg');
const Sequelize = require('sequelize');


var sequelize = new Sequelize("postgresql://neondb_owner:vtiYomfK80ap@ep-gentle-heart-a522g04k.us-east-2.aws.neon.tech/neondb?sslmode=require", 
    {
    host: 'host',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('items', { 
    body: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    itemDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
    featureImage: {
        type: Sequelize.STRING,
        allowNull: false
    },
    published: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    price: {
        type: Sequelize.DOUBLE,
        allSowNull: false
    }
});

const Category = sequelize.define('categories', {
    category: {
        type: Sequelize.STRING,
        allowNull: false
    }
});
Item.belongsTo(Category, { foreignKey: 'categoryId' });
module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize
            .sync()
            .then(() => {
                resolve();
            })  
            .catch((err) => {
                reject("Unable to sync the database: " + err.message);
            });
    });
}

module.exports.formatDate = function(dateObj){
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    let day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


module.exports.getAllItems = function(){
    return new Promise((resolve,reject)=>{
        Item.findAll()
         .then((items) => {
             resolve(items);
         })
         .catch((err) => {
             reject("no results returned");
         });
     });
 }
 module.exports.getItemsByCategory = function(category){
    return new Promise((resolve,reject)=>{
        Item.findAll({
            where: {
                category: category
            }         
        }).then((items) => {
            resolve(items);                 
        })
        .catch((err) => {
            reject("no results returned");
        });
    });
}
module.exports.getItemsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                itemDate: {
                    [Sequelize.Op.gte]: new Date(minDateStr)
                }
            }
        }).then((items) => {
            resolve(items);
        })
        .catch((err) => {
            reject("no results returned");
        });
    });
}
module.exports.getItemById = function(id){
    return new Promise((resolve,reject)=>{
        Item.findOne({
            where: {
                id: id
            }
        }).then((item) => {
            if(item) {
                resolve(item);
            }else {
                reject("no results returned");
            }
        })
        .catch((err) => {
            reject("no results returned");
        });
    });
}

module.exports.addItem = function(itemData){
    return new Promise((resolve,reject)=>{
       itemData.published = Boolean(itemData.published);
       
       for(let key in itemData){
        if(itemData[key] == ""){
            itemData[key] = null;
        }
       }
       itemData.itemDate = new Date();
       Item.create(itemData)
        .then((item) => {
            resolve(item);
        })
        .catch((err) => {
            reject("no results returned");
        });
    });
}
module.exports.getPublishedItems = function(){
    return new Promise((resolve,reject)=>{
        Item.findAll({
            where: {
                published: true
            }
        }).then((items) => {
            if(items.length > 0){
                resolve(items);
            }
            else{
                reject("no results returned");
            }
        })
        .catch((err) => {
            reject("error feching items");
        });
    });
}
module.exports.getPublishedItemsByCategory = function(category){
    return new Promise((resolve,reject)=>{
        Item.findAll({
            where: {
                category: categoryId,
                published: true
            }
        }).then((items) => {
            if(items.length > 0){
                resolve(items);
            }
            else{
                reject("no results returned");
            }
        })
        .catch((err) => {
            reject("error feching items");
        });
    });
}
module.exports.getCategories = function(){
    return new Promise((resolve,reject)=>{
      Category.findAll().then((categories) => {
        if(categories.length > 0){
          resolve(categories);
        }
        else{
          reject("no results returned");
        }
      })
      .catch((err) => {
        reject("error feching categories");
      });
    });
}

module.exports.addCategory = function(categoryData){
    return new Promise((resolve,reject)=>{
       for(let key in categoryData){
        if(categoryData[key] == ""){
            categoryData[key] = null;
        }
       }
       Category.create(categoryData)
        .then((category) => {
            resolve(category);
        })
        .catch((err) => {
            reject("unable to create category");
        });
    });
}

module.exports.deleteCategoryById = function(id){
    return new Promise((resolve, reject) => {
      Category.destroy({ where: { id: id } })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject("unable to delete category");
        });
    });
  }
  module.exports.deleteItemById = function(id){
    return new Promise((resolve, reject) => {
      Item.destroy({ where: { id: id } })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject("unable to delete item");
        });
    });
  }


