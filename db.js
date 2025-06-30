const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
    email: { type: String, unique: true },
    password: { type: String, min: 6 },
    firstName: String,
    lastName: String
})

const AdminSchema = new Schema({
    email: { type: String, unique: true },
    password: { type: String, min: 6 },
    firstName: String,
    lastName: String
})

const CourseSchema = new Schema({
    title: String,
    description: String,
    price: Number,
    imageUrl: String,
    creatorId: ObjectId
})

const PurchaseSchema = new Schema({
    userId: ObjectId,
    courseId: ObjectId
})

const UserModel = mongoose.model('Users', UserSchema);
const AdminModel = mongoose.model('Admins', AdminSchema);
const CourseModel = mongoose.model('Courses', CourseSchema);
const PurchaseModel = mongoose.model('Purchases', PurchaseSchema);

module.exports = {
    UserModel,
    AdminModel,
    CourseModel,
    PurchaseModel
}
