require('dotenv').config();
const { Router } = require('express');
const userRouter = Router();
const { userAuth } = require('../middlewares/userAuth');
const bcrypt = require('bcrypt');
const { UserModel, PurchaseModel, CourseModel } = require("../db");
const { userSignupValidationSchema, userSigninValidationSchema } = require('../validation');
const jwt = require('jsonwebtoken');

userRouter.post('/signup', async (req, res)=>{
    // get user details
    const { email, password, firstName, lastName } = req.body;

    // validate input
    const validationResult = userSignupValidationSchema.safeParse({ 
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

    try {
        // hash password
        const saltRounds = 5;
        const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

        // push to database
        const newUser = await UserModel.create({
            email: validatedData.email,
            password: hashedPassword,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName
        });

        // return a success message
        return res.status(201).json({
            message: "User signed up succesfully."
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

userRouter.post('/signin', async (req, res)=>{
    // get user details
    const { email, password } = req.body;

    // validate input
    const validationResult = userSigninValidationSchema.safeParse({ email, password });
    if(!validationResult.success){
        return res.status(400).json({
            message: "Input validation failed."
        })
    }
    const validatedData = validationResult.data;

    try {
        // fetch user information from database
        const userFound = await UserModel.findOne({ email: validatedData.email });
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
        if(!process.env.JWT_USER_SECRET){
            console.error("JWT_USER_SECRET is not defined in environment variables")
            return res.status(500).json({
                message: "Server configuration error."
            })
        }

        // generate JWT token
        const token = jwt.sign({ userId: userFound._id.toString() }, process.env.JWT_USER_SECRET);

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
        console.error("User signin error: " + err)

        // generic 500 ISE for any other unhandled exceptions
        // (e.g. issues with bcrypt hashing, jwt signing, mongoose database connection etc.)
        return res.status(500).json({
            message: "An internal server error occurred during signin. Please try again later."
        })
    }
})


// retreive all purchases for the user
userRouter.get('/purchases', userAuth, async (req, res)=>{
    try {

        // fetch purchases for the user
        const userId = req.userId;
        const purchases = await PurchaseModel.find({
            userId: userId
        });

        // handle case where user has no purchases
        if(purchases.length === 0) {
            return res.status(200).json({
                message: "You have not purchased any course yet.",
                courses: []
            })
        }

        // extract course IDs
        const courseIDs = purchases.map(p => p.courseId)

        // fetch courses using courseIDs
        const courses = await CourseModel.find({
            _id: { $in: courseIDs }
        });

        res.status(200).json({
            message: "Successfully retrieved purchased courses.",
            totalCourses: courses.length,
            courses: courses
        })

    } catch (err) {
        console.error("Error while retrieving purchases for user: " + err);
        return res.status(500).json({
            message: "An internal server error occurred while retrieving purchases. Please try again."
        })
    }
})

module.exports = {
    userRouter: userRouter
}