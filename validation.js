const { z } = require('zod');

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(100);
const passwordSchema = z.string()
    .min(8, { message: "Password must be atleast 8 characters long" })
    .regex(/[a-z]/, { messae: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain atleast one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" });

const userSignupValidationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(3).max(50),
    lastName: z.string().trim().min(3).max(50)
});

const adminSignupValidationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(3).max(50),
    lastName: z.string().trim().min(3).max(50)
});

const userSigninValidationSchema = z.object({
    email: emailSchema,
    password: passwordSchema
});

const adminSigninValidationSchema = z.object({
    email: emailSchema,
    password: passwordSchema
});

const courseValidationSchema = z.object({
    // optional because not always present 
    // (eg. courseId present for an update, but not for creation)
    // (eg. only courseId present for delete)
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    price: z.number().min(0).optional(),
    imageUrl: z.string().max(300).optional(),
    courseId: z.string().optional()
    // creatorId: handled by auth middlewares
})

const purchaseValidationSchema = z.object({
    userId: z.string(),
    courseId: z.string()
})

module.exports = {
    userSignupValidationSchema,
    userSigninValidationSchema,
    adminSignupValidationSchema,
    adminSigninValidationSchema,
    courseValidationSchema,
    purchaseValidationSchema
}