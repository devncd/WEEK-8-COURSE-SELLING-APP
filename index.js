require('dotenv').config(); //Load environment variables from .env
const mongoose = require('mongoose');
const express = require('express');
const app = express();

const { userRouter } = require('./routes/user');
const { courseRouter } = require('./routes/course');
const { adminRouter } = require('./routes/admin');

app.use(express.json()); // middleware to parse JSON body

app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/course', courseRouter);

async function main(){
    if (!process.env.MONGO_URI) { //check if the MONGO_URI is loaded
        console.error('Error: MONGO_URI is not defined in the .env file.');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(3000);
    console.log('Listening on port 3000')
}

main();