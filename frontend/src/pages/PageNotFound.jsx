import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Button } from '@/components/ui/Button';


const PageNotFound = () => {
    const error = useRouteError();
    const navigate = useNavigate('/');

    return (<>
        <ThemeProvider defaultTheme='dark' storageKey='ui-theme'>
            <div className='flex flex-col space-y-10 justify-center items-center text-2xl min-h-screen'>
                <div>
                    {isRouteErrorResponse(error) ? 'Page Not Found.' : 'An Error Occurred: ' + error} {/* TODO: Build here something interesting. */}
                </div>
                <Button onClick={() => navigate('/')}>Take me back</Button>
            </div>
        </ThemeProvider>
    </>)
}

export default PageNotFound
