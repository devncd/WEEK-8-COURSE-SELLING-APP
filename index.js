const express = require('express');
const app = express();

app.post('/user/signup', (req, res)=>{
    res.json({
        message: "User signup endpoint"
    })
})

app.post('/user/signin', (req, res)=>{
    res.json({
        message: "User signin endpoint"
    })
})

app.post('/user/purchases', (req, res)=>{
    res.json({
        message: "User purchases endpoint"
    })
})

app.post('/course/purchase', (req, res)=>{
    res.json({
        message: "Course purchase endpoint"
    })
})

app.post('/courses', (req, res)=>{
    res.json({
        message: "Courses endpoint"
    })
})

app.listen(3000);