const express = require('express')
const router = express.Router();
const {check , validationResult} = require('express-validator')
const {hash, compare} = require('bcryptjs')
const User = require('../models/user')
const {verify, sign} = require('jsonwebtoken');
const { isSignedIn } = require('../controller/auth');
// const {createAccessToken, createRefreshToken} =require('../token/token')
const {isAuth } = require('../controller/auth');

router.post(
    '/signup',
  [
    // check("role", "You must have choose account type Buyer/Merchent").notEmpty(),
    check("name", "Name should be at least 3 char").isLength({ min: 3 }),
    check("email", "Email is required").isEmail(),
    check("password", "Password should be at least 3 char").isLength({ min: 3 })
  ],
  async (req,res)=>{
      const error = validationResult(req);
      if(!error.isEmpty()){
          return res.status(422).json({
            error: error.array()[0].msg
          });
      }

      const {name, email, password} = req.body

      try {

        const hashedPassword = await hash(password,10)
        console.log(hashedPassword);
        const user = new User({
          name,
          email,
          password: hashedPassword
        })
        user.save((err,user)=>{
          if(err)  {
             return res.status(400).json({
             err: err,
             messege: "Unable to save in db"
             });
          }
          res.status(200).json({status: "OK", messege: {
            name: user.name,
            email: user.email,
            id:user._id
          }})
        })
      } catch (error) {
        console.log(error)
        return res.status(400).json(error)
      }

      // const user = new User(req.body);
      // console.log("from signup bac",req.body);
      // user.save((err, user) => {
      //   if (err) {
      //     return res.status(400).json({
      //       err: "NOT able to save user in DB"
      //     });
      //   }
      //   res.json({
      //     name: user.name,
      //     email: user.email,
      //     id: user._id
      //   });
      // });    
  }
)


router.post('/signin', [
  check("email", "email is required").isEmail(),
  check("password", "Password field is required").isLength({min:2})
],
  async (req,res)=>{
    const error= validationResult(req);
    const {email, password}  = req.body;

    if(!error.isEmpty()){
      return res.status(422).json({
        error: error.array()[0].msg
      })
    }

    // find the user in db
    User.findOne({email}, async (err, user)=>{
      if( err || !user){
        return res.status(400).json({
          error: err,
          message: "User Email does not exist"
        })
      }
// compare the password in db
      const validPassword = await compare(password, user.password);
      if(!validPassword) return res.status(400).json("Email & password didn't match")
      
      // const token= 
      // create token
      const {_id, name, email, role} = user;
      const token= sign({_id}, process.env.ACCESS_TOKEN_SECRET,{expiresIn: "60s"})
      res.cookie('token', token, {expire: new Date()+99 }) 
      res.json({token, user:{_id,name, email, role}})
    })
  }
)

router.get('/signout', (req,res)=>{
  res.clearCookie("token");
  res.json({message: "User Signout successfully"})
})

router.get('/protected', isAuth, (req,res)=>{
  res.json({msg: "this is protected routes", u: req.userId});
})









module.exports = router;