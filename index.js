import express from "express"
import path from "path"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import { decode } from "punycode";

const app=express();
mongoose.connect("mongodb://localhost:27017",{
    dbName: "backend-again"
}).then(()=>{
    console.log("database connected");
})
.catch((e)=>{
    console.log("error detected",e);
})


app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

const messageSchema=new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const Message=mongoose.model("logininfo",messageSchema);


const isAuthenticated=async(req,res,next)=>{
    let {token}=req.cookies;
    if(token){
        let decoded=jwt.verify(token,"abcdefghijklmnopqrstuvwxyz");
        req.user=await Message.findById(decoded._id);
        res.render("logout.ejs",{name: req.user.name});
    }
    else next();
}

app.get("/",isAuthenticated,(req,res)=>{
    res.render("login.ejs");
})

app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.post("/login",async(req,res)=>{
    let {name,email,password}=req.body;
    let user=await Message.findOne({email});
    if(!user) return res.redirect("/register");
    else res.render("logout.ejs",{name: name})
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})


app.post("/register",async(req,res)=>{
    // res.send("register");
    let {name,email,password}=req.body;
    // console.log(req.body);
    let user= await Message.findOne({email});
    // console.log(user);
    if(user){
        return res.redirect("/login");
    }
    const hashedPassword=await bcrypt.hash(password,10);
    let msg=await Message.create({name,email,hashedPassword});
    // console.log(msg);

    const token=jwt.sign({_id: msg._id},"abcdefghijklmnopqrstuvwxyz");
    // console.log(token);

    res.cookie("token",token,{
        httpOnly: true,
        expires: new Date(Date.now()+60*1000),
    });
    // res.send("register");
    res.redirect("/login");
})


app.post("/logout",(req,res)=>{
    let arr=Object.keys(req.cookies);
    res.clearCookie(arr[0]);
    res.redirect("/");
})

app.listen(5000,()=>{
    console.log("server is working");
})