const { Router } = require('express');
const userRouter = Router();
const { userAuth } = require('../middlewares/userAuth');

userRouter.post('/signup', (req, res)=>{
    res.json({
        message: "User signup endpoint"
    })
})

userRouter.post('/signin', (req, res)=>{
    res.json({
        message: "User signin endpoint"
    })
})

userRouter.get('/purchases', userAuth, (req, res)=>{
    res.json({
        message: "User purchases endpoint"
    })
})

module.exports = {
    userRouter: userRouter
}