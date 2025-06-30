const { Router } = require('express');
const courseRouter = Router();


courseRouter.post('/purchase', (req, res)=>{
    res.json({
        message: "Course purchase endpoint"
    })
})

courseRouter.get('/preview', (req, res)=>{
    res.json({
        message: "Course preview endpoint"
    })
})

module.exports = {
    courseRouter: courseRouter
}