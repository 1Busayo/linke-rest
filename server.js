var express = require('express');
const cors = require('cors');
var app = express();
// var bodyParser = require('body-parser');
var mysql = require('mysql');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// get config vars
dotenv.config();

app.use(express.json() , cors()); //Used to parse JSON bodies


//app.use(express.urlencoded());

function authenticateToken(req, res, next) {
   // const authHeader = req.headers['Authorization']
    //const token = authHeader && authHeader.split(' ')[1]
    
    const token = (req.headers.authorization !== undefined) ? req.headers.authorization.toString() : "";
   // console.log('toks', req.headers.authorization)

    if (token == null || token == '') return res.sendStatus(401)
  
    jwt.verify(token, process.env.TOKEN_SECRET.toString() , (err, user) => {
      //console.log(err)
  
   
      if (err) return res.sendStatus(403)
  
      req.user = user
  
      next()
    })
  }


  function generateAccessToken(username) {
    //return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
    return jwt.sign(username, process.env.TOKEN_SECRET);
  }




// default route
app.get('/', authenticateToken,function (req, res) {
return res.send({ error: true, message: 'hello' })
});


app.post('/key', (req, res) => {
    // ...
  
    const token = generateAccessToken({ username: req.body.username });
    res.json(token);
  
    // ...
  });



// connection configurations
var dbConn = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'root',
database: 'restdb'
});
// connect to database
dbConn.connect(); 



let xon = '';


// Retrieve user with id 
app.get('/check/:id', function (req, res) {
  let user_id = req.params.id;
  if (!user_id) {
  return res.status(400).send({ error: true, message: 'Please provide user_id' });
  }
  dbConn.query('SELECT count(*) as total FROM users where wallet_address=?', user_id, function (error, results, fields) {
  if (error) throw error;
  return res.send({ error: false, data: results[0].total, message: 'users list.' });
  });
  });


// Retrieve all users 
app.get('/users', authenticateToken ,function (req, res) {
dbConn.query('SELECT * FROM users', function (error, results, fields) {

try {

  return res.send({ status:"", data: results, message: 'users list.' });

} catch (error) {
  return res.send({data:"failed"})
}
});
});


// Retrieve all users 
app.get('/allmimes', authenticateToken ,function (req, res) {
  dbConn.query('SELECT * FROM users a , mime b where a.wallet_address = b.wallet_address ORDER BY b.mime_id DESC', function (error, results, fields) {
  
  try {
  
    return res.send({ status:"success", data: results, message: 'all mimes.' });
  
  } catch (error) {
    return res.send({data:"failed"})
  }




});

});


// Retrieve user collections or mimes
app.get('/usermimes/:id', function (req, res) {
  let user_id = req.params.id;
  if (!user_id) {
  return res.status(400).send({ error: true, message: 'Please provide address' });
  }
  dbConn.query('SELECT * FROM users a , mime b where a.wallet_address =? and b.wallet_address =? ORDER BY b.mime_id DESC', [user_id,user_id], function (error, results, fields) {
  if (error) throw error;
  return res.send({ error: false, data: results, message: 'users list.' });
  });
  });



// Retrieve user with id 
app.get('/getuser/:id', function (req, res) {
let user_id = req.params.id;
if (!user_id) {
return res.status(400).send({ error: true, message: 'Please provide user_id' });
}
dbConn.query('SELECT * FROM users where wallet_address=?', user_id, function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results[0], message: 'users list.' });
});
});
// Add a new user  


app.post('/adduser', authenticateToken, function (req, res) {


  let user = req.body.walletAddress;
  
  const data =   {
     
     wallet_address : req.body.walletAddress,
     name : req.body.name ,
     is_profile_img_nft : req.body.isProfileImageNft.toString(),
     profile_img_ipfs : req.body.profileImage
    
  };
  
  console.log('incoming',data)


const check1  = (user,cb ) => {

   dbConn.query('SELECT count(*) as total FROM users where wallet_address=?', user , function (error, results, fields) {
    if (error) throw error;
   return cb(results[0].total) ;
    });
}
 

    
 check1(user,(result)=>{


  if (  result == 0) {
     console.log('numx', result );
  dbConn.query("INSERT INTO users SET ? ",data, function (error, results, fields) {
  if (error) throw error;
  return res.send({ error: false, data: results, message: 'New user has been created successfully.' });
  });

 }

 })

  });
  




app.post('/addmimes', authenticateToken, function (req, res) {


 
 
  const data = {
    wallet_address: req.body.walletaddress,
    mime_title: req.body.mimeTitle,
    mime_desc: req.body.mimeDesc,
    mime_img_url: req.body.mimeImage
}

  
  console.log('incoming',data)



 


  dbConn.query("INSERT INTO mime SET ? ",data, function (error, results, fields) {
  if (error) throw error;
  return res.send({ error: false, data: results, message: 'mime has been posted' });
  });





  });
  






// app.post('/adduser', authenticateToken, function (req, res) {


// let user = req.body.walletAddress;

// const data =   {
   
//    wallet_address : req.body.walletAddress,
//    name : req.body.name ,
//    is_profile_img_nft : req.body.isProfileImageNft,
//    profile_img_ipfs : req.body.profileImage
  
// };

// if (!user) {
// return res.status(400).send({ error:true, message: 'Please provide user' });
// }
// dbConn.query("INSERT INTO users SET ? ",data, function (error, results, fields) {
// if (error) throw error;
// return res.send({ error: false, data: results, message: 'New user has been created successfully.' });
// });
// });






//  Update user with id
app.put('/user', function (req, res) {
let user_id = req.body.user_id;
let user = req.body.user;
if (!user_id || !user) {
return res.status(400).send({ error: user, message: 'Please provide user and user_id' });
}
dbConn.query("UPDATE users SET user = ? WHERE id = ?", [user, user_id], function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'user has been updated successfully.' });
});
});
//  Delete user
app.delete('/user', function (req, res) {
let user_id = req.body.user_id;
if (!user_id) {
return res.status(400).send({ error: true, message: 'Please provide user_id' });
}
dbConn.query('DELETE FROM users WHERE id = ?', [user_id], function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'User has been updated successfully.' });
});
}); 
// set port
app.listen(3000, function () {
console.log('Node app is running on port 3000');
});
module.exports = app;
