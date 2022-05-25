const {verify} = require('jsonwebtoken');

const isAuth=(req, res, next)=>{
    // console.log(req.headers)
    const authorization = req.headers.bearer;
    if(!authorization) return res.status(400).json("pass the token")
    const token = authorization
    // const detail = verify(token, process.env.ACCESS_TOKEN_SECRET)
    verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
        if(err) return res.json({err, msg: "Please login again"})
        // console.log("(####",detail)
        req.userId= decode
        // console.log("ajjajajaja")
        next();
    })
    // console.log("trrrr")
}



module.exports = {
    isAuth
}