import { useState } from 'react'
import EmailService from '@/services/EmailService';
import UserService from '@/services/UserService';
import { setAccessToken } from '@/services/ApiClient';
import { useUserContext } from '@/hooks/useUserContext';
import { cognitoSignIn, cognitoSignUp } from '@/cryptography/AWS_Cognito/Cognito';

const useAuth = () => {
    const { user, login, logout, publicKey } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const register = async (data) => {
        logout(); // If some user is logged in. Log them out
        setIsLoading(true);
        setError(null);

        try {
            const response = await UserService.createUser(data);
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration Failed'
            setError(errorMessage);
            return { success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    };

    const cognitoRegister = async (data) => {
        setIsLoading(true);
        setError(null);

        const { email, username, password } = data;
        try{
            const cognitoResponse = await cognitoSignUp(email, username, password);
            return { success: true };
        } catch (err) {
            const errorMessage = 'Registration to AWS Cognito Failed'
            return { success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    };

    const verifyEmail = async (email, username, password) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await EmailService.confirmEmail({email: email});
            const token = response.data.access_token;

            setAccessToken(token);
            await cognitoSignIn(username, password);

            const userResponse = await UserService.getUserDetails();
            login(userResponse.data);

            return {success: true};
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed';
            setError(errorMessage);
            return { success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    };

    const loginUser = async (credentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const tokenResponse = await UserService.getTokens(credentials);
            setAccessToken(tokenResponse.data.access);
            const userResponse = await UserService.getUserDetails();
            const { username, password } = credentials;
            const cognitoResponse = await cognitoSignIn(username, password);
            login(userResponse.data);

            if (!publicKey.current) {
                // Fetch public key on login OR fetch already all public keys for every user - that's faster but it has to include current user's public key as well
                
            }

            return {success: true}
        } catch (err) {
            let errorMessage = err.response?.data?.detail || err.response?.data?.message || err?.message || 'Login Failed';
            setError(errorMessage);
            return {success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    };

    const loginOnPageRefresh = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await UserService.refreshToken();
            setAccessToken(response.data.access);
            const userDataResponse = await UserService.getUserDetails();
            login(userDataResponse.data);

            return {success: true}
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'User does not exist or email not confirmed';
            setError(errorMessage);
            return {success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (data) => {
        setIsLoading(true);
        setError(null);

        const username = user.username
        const email = user.email
        if (username === data.username && email === data.email) {
            setIsLoading(false);
            return {success: true, response: 'Nothing to update'}
        }

        try {
            const response = await UserService.updateUser(data);
            if (response.status === 200)
                login(response.data);

                if (email !== response.data.email)
                    return {success: true, response: 'Profile updated successfully! Verification email has been sent. Please verify you account by clicking a link in the email.'}

            return {success: true, response: response.data}
        } catch (err) {
            const errorMessage = err.response?.data?.username || err.response?.data?.email || 'Failed updating user details';
            setError(errorMessage);
            return {success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    };

    const changePassword = async (data) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await UserService.changePassword(data);
            return { success: true, response: response.data };
        } catch (err) {
            const errorMessage =
                err.response?.data?.currentPassword ||
                err.response?.data?.confirmPassword ||
                'Failed to update password';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const resendVerificationEmail = async (email) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await EmailService.resendEmail(email) // TODO: Finish this hook!!!!!!!!!!!!!!!!!
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data || 'Failed to send email';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const uploadPubliKey = async (key) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await UserService.sendPublicKey({public_key: key});
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data || 'Failed to send email';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const deleteUser = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await UserService.deleteUser();
            logout(); // Log out user after deletion
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete account';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    return { register, cognitoRegister, verifyEmail, loginUser, loginOnPageRefresh, updateUser, changePassword, resendVerificationEmail, uploadPubliKey, deleteUser, isLoading, error, setError };
}

export default useAuth
