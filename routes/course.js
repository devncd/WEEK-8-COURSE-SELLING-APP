const { Router } = require('express');
const courseRouter = Router();
const { userAuth } = require('../middlewares/userAuth');
const { CourseModel, PurchaseModel } = require('../db');
const { purchaseValidationSchema } = require('../validation');

// purchase a course
courseRouter.post('/purchase', userAuth, async (req, res)=>{
    try {

        const userId = req.userId;
        const courseId = req.body.courseId;

        const validationResult = purchaseValidationSchema.safeParse({
            userId,
            courseId
        });

        if(!validationResult.success){
            return res.status(400).json({
                message: "Invalid course ID. Please provide a correct course ID."
            })
        }

        const validatedData = validationResult.data;

        //TODO in future: payment logic

        const purchase = await PurchaseModel.create({
            userId: validatedData.userId,
            courseId: validatedData.courseId
        });

        return res.status(200).json({
            message: "You have succesfully purchased the course."
        })

    } catch (err) {
        console.error("Error while purchasing a course: " + err);
        return res.status(500).json({
            message: "An internal server error occurred while purchasing a course. Please try again."
        })
    }
})

// preview all available/offered courses
courseRouter.get('/preview', async (req, res)=>{
    const courses = await CourseModel.find({});

    return res.status(200).json({
        courses
    })
})

module.exports = {
    courseRouter: courseRouter
}