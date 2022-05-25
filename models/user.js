const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
      type: String,
      required: true,
      maxlength: 32,
      trim: true
    },
    lastname: {
      type: String,
      maxlength: 32,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true
    },
    userinfo: {
      type: String,
      trim: true
    },
    role:{
        type: String,
        required: true,
        default: "petient" // Doctor/ Petient / Nurse
    },
    password:{
        type:String,
        trim: true,
        required: true,
    }

},{timestamps: true})



module.exports = mongoose.model("User", userSchema);

