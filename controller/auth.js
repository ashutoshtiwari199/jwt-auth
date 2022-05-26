const {verify} = require('jsonwebtoken');

const isAuth=(req, res, next)=>{
    const authorization = req.headers.bearer;
    if(!authorization) return res.status(400).json("pass the token")
    const token = authorization
    verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
        if(err) return res.json({err, msg: "Please login again"})
        req.userId= decode
        next();
    })
}



module.exports = {
    isAuth
}