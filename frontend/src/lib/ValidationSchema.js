import { z } from 'zod'


const defaultSchema = z.string()
    .min(1, {message: 'This field is required.'})

const usernameSchema = defaultSchema
    .min(3, {message: 'Username has to be at least 3 characters long.'})
    .max(150, {message: 'Username cannot exceed 150 characters.'})

const emailSchema = defaultSchema
    .email('Please enter a valid email address.')

const passwordSchema = defaultSchema
    .min(8, { message: 'Password has to be at least 8 characters long.' })
    .max(128, { message: 'Password cannot exceed 128 characters.' })
    .refine((password) => /[A-Z, a-z]/.test(password), {
        message: 'Password cannot be entirely numeric.',
})
    .refine((password) => /[A-Z]/.test(password), {
        message: 'Password has to contain at least one uppercase letter.',
})
    .refine((password) => /[a-z]/.test(password), {
        message: 'Password has to contain at least one lowercase letter.',
})
    .refine((password) => /[0-9]/.test(password), { message: 'Password has to contain at least one number.' })
    .refine((password) => /[!@#$%^&*_\-=.]/.test(password), {
        message: 'Password has to contain at least one of the following special characters: !@#$%^&*_=.',
});


const RegisterFormSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string().min(1, { message: "This field is required." }) // This is just so for the estetics so that if all fields are empty the confirm password also displays error - in this way it simply looks better
}).refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ["confirm"]
});


const LoginFormSchema = z.object({
    username: z.string().min(1, {message: 'This field is required.'}),
    password: z.string().min(1, {message: 'This field is required.'}),
});

const UpdateUserDataSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
})

const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: "This field is required." }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: "This field is required." }) // This is just so for the estetics so that if all fields are empty the confirm password also displays error - in this way it simply looks better
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ["confirmPassword"]
});

const EmailVerificationFormSchema = z.object({
    username: z.string().min(1, {message: 'This field is required.'}),
});

// const userId = z.string().refine(async (id) => { //TODO: elaborate on this with zod
//   // verify that ID exists in database
//   return true;
// });


export { RegisterFormSchema, LoginFormSchema, UpdateUserDataSchema, UpdatePasswordSchema, EmailVerificationFormSchema }