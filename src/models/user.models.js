import mongoose, { MongooseError, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        lowercase : true,
        trim : true,
        unique : true,
        index : true
    },
    email : {
        type : String,
        trim : true,
        lowercase : true,
        required :true,
        lowercase : true,
        unique : true
    },
    fullname : {
        trim : true,
        type: String,
        required :true,
        lowercase : true,
        index : true
    },
    avatar : {
        type : String, //cloudinary
        required : true,
    },
    coverImage : {
        type: String,

    },
    password : {
        type : String,
        required : true,
        trim : true
    },
    refreshToken: {
        type: String,
        required: true,
    },
    watchHistory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
    }
},{timestamps: true})



//! password hashing and checking
userSchema.pre("save", async function (next){

    //* check whether the previous password is modified or not
    if(!this.isModified("password")) return next();

    //* if not modified then hash the password
    this.password = bcrypt.hash(this.password, 10);
    next();
})
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
}


//! injecting methods to generate refresh and access ACCESS_TOKEN_SECRET

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(

        //? less data to be sent as payload than access token
        {
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)}


userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(

        //? less data to be sent as payload than access token
        {
            _id : this._id,
        },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)}

export const User = mongoose.model("User", userSchema);