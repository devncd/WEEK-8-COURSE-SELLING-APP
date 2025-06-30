const { Router } = require('express');
const adminRouter = Router();

adminRouter.post('/signup', (req, res)=>{
    res.json({
        message: "Admin signup endpoint"
    })
})

adminRouter.post('/signin', (req, res)=>{
    res.json({
        message: "Admin signin endpoint"
    })
})

adminRouter.post('/course', (req, res)=>{
    res.json({
        message: "Admin -> create course endpoint"
    })
})

adminRouter.put('/course', (req, res)=>{
    res.json({
        message: "Admin -> update course endpoint"
    })
})

adminRouter.delete('/course', (req, res)=>{
    res.json({
        message: "Admin -> delete course endpoint"
    })
})

adminRouter.get('/course/bulk', (req, res)=>{
    res.json({
        message: "Admin -> get all courses endpoint"
    })
})

module.exports = {
    adminRouter: adminRouter
}