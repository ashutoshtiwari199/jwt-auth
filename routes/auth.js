const express = require('express')
const router = express.Router();
const {check , validationResult} = require('express-validator')
const {hash, compare} = require('bcryptjs')
const path = require('path');
const User = require('../models/user')
const {verify, sign} = require('jsonwebtoken');
const { isSignedIn } = require('../controller/auth');
// const {createAccessToken, createRefreshToken} =require('../token/token')
const {isAuth } = require('../controller/auth');
const nodemailer = require('nodemailer')

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

/* Forgot password
* Step 1. take the emailId from user
* Step 2. Sent a link to their email. take a password and confirm password.
* Step 3. Save new password
*/

// Step 1.

router.post('/forgot_password',[
  check("email", "Email is required").isEmail(),
], (req,res)=>{
  const error = validationResult(req);
  if(!error.isEmpty()){
    return res.status(422).json({
      error: error.array()[0].msg
    });
  }
  const {email} = req.body;
  try {

    User.findOne({email}, async(err, user)=>{
      if (err || !user){
        return res.status(400).json({
          error: err,
          message: "User Email does not exist"
        })       
      }
      const forgotPasswordToken= sign({id: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "300s"})
      /***
       * This should be send in registered email, 
       * I will setup the mail later as of now I am sending it as a json response.
      ***/
      res.cookie('token', forgotPasswordToken, {expire: new Date().setTime(new Date().getTime()+ 5*60*1000) }) // 5 minute life span for coockies 
      res.json({msg:"Forgot password request", link: `http://localhost:8000/api/set_new_password/${forgotPasswordToken}`})
    })
  } catch (error) {
    res.json(error)
  }
})


//STEP 2.

router.get('/set_new_password/:token',(req,res)=>[
  verify(req.params.token, process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
    if(err) return res.json({err, msg: "Please request again for forgot password"})
    res.sendFile(path.join(__dirname,'../controller/newPassword.html'))
  })
])

// STEP 3.

router.post('/save_new_password', async (req,res)=>{
  const {password,confirmPassword} = req.body;
  console.log(password, confirmPassword, req.cookies.token)
  if(password !==confirmPassword){
    res.status(400).json({msgcode:'error', message: "Password & ConfirmPassword did not match"})
  }

  try {    
  const newPassword=await hash(password,10)
  verify( req.cookies.token, process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
    if(err) return res.json({err, msg: "Your session is expired, Please try again"})
    console.log(decode)
      User.updateOne({_id :decode.id},{$set : {"password" : newPassword}},(err,user)=>{
        if(err) res.status(400).json({error: err, message: "Failed to update your password"})
        res.clearCookie("token");
        res.status(200).json({status:"OK", message: "Your password is successfully updated"})
      })
    })
  } catch (error) {
    res.status(400).json("something went wrong while saving a new password")
  }  
} )


router.get('/protected', isAuth, (req,res)=>{
  res.json({msg: "this is protected routes", u: req.userId});
})









module.exports = router;