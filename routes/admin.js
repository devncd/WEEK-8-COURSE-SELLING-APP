require('dotenv').config();
const { Router } = require('express');
const adminRouter = Router();
const { adminAuth } = require('../middlewares/adminAuth');
const { z } = require('zod');
const { adminSignupValidationSchema, adminSigninValidationSchema, courseValidationSchema } = require('../validation');
const bcrypt = require('bcrypt');
const { AdminModel, CourseModel } = require('../db');
const jwt = require('jsonwebtoken');

adminRouter.post('/signup', async (req, res)=>{
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

    try {
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

    try {
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
            message: "An internal server error occurred during signin. Please try again later."
        })
    }
})


//creates a new course
adminRouter.post('/course', adminAuth, async (req, res)=>{
    //get required information
    const adminId = req.userId;
    const { title, description, price, imageUrl } = req.body;

    // validate input
    const validationResult = courseValidationSchema.safeParse({ title, description, price, imageUrl });
    if(!validationResult.success) {
        return res.status(400).json({
            message: "Incorrect data. Please provide valid input."
        });
    }
    const validatedData = validationResult.data;

    try{
        // create course
        await CourseModel.create({
            title: validatedData.title, 
            description: validatedData.description, 
            price: validatedData.price, 
            imageUrl: validatedData.imageUrl, 
            creatorId: adminId
        });

        return res.status(200).json({
            message: "New course added."
        })

    } catch (err) {
        console.error("Error while creating a new course: " + err);

        return res.status(500).json({
            message: "An internal server error occurred while creating a new course. Please try again later."
        })
    }
})


// updates a specified course
adminRouter.put('/course', adminAuth, async (req, res)=>{
    //get required information
    const adminId = req.userId;
    const { title, description, price, imageUrl, courseId } = req.body;

    // validate input
    const validationResult = courseValidationSchema.safeParse({ title, description, price, imageUrl, courseId });
    if(!validationResult.success) {
        return res.status(400).json({
            message: "Incorrect data. Please provide valid input."
        });
    }
    const validatedData = validationResult.data;

    try{
        // confirm admin permission to update this course
        const foundCourse = await CourseModel.findOne({
            creatorId: adminId,
            _id: courseId
        });

        if(!foundCourse){
            return res.status(403).json({
                message: "You do not have permission to modify this course."
            })
        }

        // find and update course
        await CourseModel.updateOne({
            creatorId: adminId,
            _id: courseId 
        },
            {
            title: validatedData.title, 
            description: validatedData.description, 
            price: validatedData.price, 
            imageUrl: validatedData.imageUrl, 
            creatorId: adminId
        });

        return res.status(200).json({
            message: "Course updated."
        })

    } catch (err) {
        console.error("Error while updating a course: " + err);

        return res.status(500).json({
            message: "An internal server error occurred while updating a course. Please try again later."
        })
    }
})


// deletes a specified course
adminRouter.delete('/course', adminAuth, async (req, res)=>{
    //get required information
    const adminId = req.userId;
    const courseId = req.body.courseId;

    // validate input
    const validationResult = courseValidationSchema.safeParse({ courseId });
    if(!validationResult.success) {
        return res.status(400).json({
            message: "Incorrect Course ID."
        });
    }
    const validatedData = validationResult.data;

    try{
        // confirm admin permission to delete this course
        const foundCourse = await CourseModel.findOne({
            creatorId: adminId,
            _id: courseId
        });

        if(!foundCourse){
            return res.status(403).json({
                message: "You do not have permission to delete this course."
            })
        }

        // delete the course
        await CourseModel.deleteOne({
            creatorId: adminId,
            _id: courseId 
        });

        return res.status(200).json({
            message: "Course deleted."
        })

    } catch (err) {
        console.error("Error while deleting a course: " + err);

        return res.status(500).json({
            message: "An internal server error occurred while deleting a course. Please try again later."
        })
    }
})


// returns all courses owned by the creator/admin
adminRouter.get('/course/bulk', adminAuth, async (req, res)=>{
    try {
        const adminId = req.userId;

        const courses = await CourseModel.find({
            creatorId: adminId
        });

        return res.status(200).json({
            message: "Course(s) retrieved.",
            courses
        })

    } catch (err) {
        console.error("Error while accessing courses: " + err);

        return res.status(500).json({
            message: "An internal server error occurred while accessing courses. Please try again later."
        })
    }
})

module.exports = {
    adminRouter: adminRouter
}