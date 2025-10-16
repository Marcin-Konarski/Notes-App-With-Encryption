import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Link } from 'react-router-dom'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/Form'


const LoginRegisterForm = ({ title, redirect, inputs, form, button, reset, onSubmit }) => {

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className='flex flex-col space-y-4' style={{ width: 'clamp(300px, 20vw, 800px)' }}>

                    {/* Page title part */}
                    <div className='flex flex-col m-0 items-center'>
                        <h1 className='text-2xl font-bold'>{title}</h1>
                        <div className='mt-0 mb-5 text-xs text-center'>
                            <span className='font-bold'>{redirect.message} </span>
                            <Button variant='link' className='p-0 text-xs' asChild>
                                <Link to={redirect.link}>{redirect.text}</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Inputs part */}
                    {inputs.map( input => 
                        <FormField key={input.name} control={form.control} name={input.name} render={({ field }) => (
                            // Any component here can access field name e.g. "username" via context
                            <FormItem>
                                <FormControl>
                                    {['password', 'confirm'].includes(input.name)
                                        ? <PasswordInput placeholder={input.placeholder} {...field} />
                                        : <Input placeholder={input.placeholder} type={input.type} {...field} />
                                    }
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                    {/* Button part */}
                    <div className='flex flex-col m-0'>
                        <Button type='submit'>{button}</Button>
                        {reset && <Button variant='link' className='self-start -ml-2' asChild>
                            <Link to='/'>Forgot password?</Link>
                        </Button>}
                    </div>

                </div>
            </form>
        </Form>
    )
}

export default LoginRegisterForm

//! RESET PASSWORD FUNCTIONALITY DOES NOT WORK FOR NOW!!
//TODO: IMPLEMENT RESET FUNCTIONALITY