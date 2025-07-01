require('dotenv').config();
const { Router } = require('express');
const adminRouter = Router();
const { adminAuth } = require('../middlewares/adminAuth');
const { z } = require('zod');
const { adminSignupValidationSchema, adminSigninValidationSchema } = require('../validation');
const bcrypt = require('bcrypt');
const { AdminModel } = require('../db');
const jwt = require('jsonwebtoken');

adminRouter.post('/signup', async (req, res)=>{
    try {
        // get user details
        const { email, password, firstName, lastName } = req.body;

        // validate input
        const validationResult = adminSignupValidationSchema.safeParse({ 
            email, 
            password, 
            firstName, 
            lastName 
        });

        // if validation fails return a 400 bad request with errors
        if(!validationResult.success) {
            const validationErrors = validationResult.error.errors;
            const simplifiedErrors = validationErrors.map(err => {
                // makes error objects cleaner by keeping only the path and the message property
                return {
                    path: err.path.join('.'), // .join() converts the path property (an array) into a string
                    message: err.message
                }
            });
            return res.status(400).json({
                message: "Input validation failed.",
                errors: simplifiedErrors
            })
        }

        // store validated data
        const validatedData = validationResult.data;

        // hash password
        const saltRounds = 5;
        const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

        // push to database
        const newAdmin = await AdminModel.create({
            email: validatedData.email,
            password: hashedPassword,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName
        });

        // return a success message
        return res.status(201).json({
            message: "Admin signed up succesfully."
        })
    } catch (err) {
        // log the full error for server-side debugging
        console.error("Signup error: " + err);

        // handle Mongoose duplicate key error (code 11000, because email schema is set to unique: true)
        if(err.code === 11000) {
            return res.status(409).json({
                message: "Email already exists. Please use a different one."
            })
        }
       
        // handle other unexpected errors 
        // (e.g. bcrypt hashing issues, database connection problems etc.)
        return res.status(500).json({
            message: "An internal server error occured during sign up. Please try again later."
        })
    }
})

adminRouter.post('/signin', async (req, res)=>{
    try {
        // get user details
        const { email, password } = req.body;

        // validate input
        const validationResult = adminSigninValidationSchema.safeParse({ email, password });
        if(!validationResult.success){
            return res.status(400).json({
                message: "Input validation failed."
            })
        }
        const validatedData = validationResult.data;

        // fetch user information from database
        const userFound = await AdminModel.findOne({ email: validatedData.email });
        if(!userFound){
            return res.status(401).json({
                message: "Invalid credentials."
            })
        }

        // compare password hash
        const passwordMatch = await bcrypt.compare(validatedData.password, userFound.password);
        if(!passwordMatch){
            return res.status(401).json({
                message: "Invalid credentials."
            })
        }

        // ensure process.env.JWT_ADMIN_SECRET is set in .env file
        if(!process.env.JWT_ADMIN_SECRET){
            console.error("JWT_ADMIN_SECRET is not defined in environment variables")
            return res.status(500).json({
                message: "Server configuration error."
            })
        }

        // generate JWT token
        const token = jwt.sign({ userId: userFound._id.toString() }, process.env.JWT_ADMIN_SECRET);

        // return a success response
        return res.status(200).json({
            message: "Login successful.",
            token: token,
            user: {
                email: userFound.email,
                firstName: userFound.firstName,
                lastName: userFound.lastName
            }
        });

    } catch(err){
        // log error for server-side debugging
        console.error("Admin signin error: " + err)

        // generic 500 ISE for any other unhandled exceptions
        // (e.g. issues with bcrypt hashing, jwt signing, mongoose database connection etc.)
        return res.status(500).json({
            message: "Internal Server Error."
        })
    }
})

adminRouter.post('/course', adminAuth, (req, res)=>{
    res.json({
        message: "Admin -> create course endpoint"
    })
})

adminRouter.put('/course', adminAuth, (req, res)=>{
    res.json({
        message: "Admin -> update course endpoint"
    })
})

adminRouter.delete('/course', adminAuth, (req, res)=>{
    res.json({
        message: "Admin -> delete course endpoint"
    })
})

adminRouter.get('/course/bulk', adminAuth, (req, res)=>{
    res.json({
        message: "Admin -> get all courses endpoint"
    })
})

module.exports = {
    adminRouter: adminRouter
}