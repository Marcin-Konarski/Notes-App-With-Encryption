import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'

import useAuth from '@/hooks/useAuth';
import AlertError from '@/components/ui/AlertError';
import AlertSuccess from '@/components/ui/AlertSuccess';
import { confirmCognitoSignUp } from '@/cryptography/AWS_Cognito/Cognito';
import EmailVerificationForm from '@/components/EmailVerificationForm';
import useKeyPair from '@/cryptography/asymetric/useKeyPair';
import { useUserContext } from '@/hooks/useUserContext';


const EmailVerification = () => {
  const navigate = useNavigate();
  const createdAccount = useLocation().state?.createdAccount;
  const email = useLocation().state?.email;
  const username = useLocation().state?.username;
  let password = useLocation().state?.password;
  const { createRSAKeyPairForKeyWrapping  } = useKeyPair();
  const { publicKey } = useUserContext();
  const { loginUser, verifyEmail, uploadPubliKey, error, setError } = useAuth();
  const [status, setStatus] = useState('pending');
  const [validating, setValidating] = useState(false)

  const handleValidate = async (username, otp) => {
    setValidating(true);
    setError(null);

    try {
      await confirmCognitoSignUp(username, otp);

      const backendStatus = await verifyEmail(email, username, password); // If we get here, Cognito confirmation was successful

      if (backendStatus.success) {

        publicKey.current = await createRSAKeyPairForKeyWrapping(true);
        await uploadPubliKey(JSON.stringify(publicKey.current));

        await loginUser({username: username, password: password})
        password = ''

        setStatus('success');
        navigate('/');
      } else {
        setError(backendStatus.error || 'Failed to verify email on backend');
        setStatus('error');
      }

    } catch (err) {
      password = ''
      console.error('Validation error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
      setStatus('error');
    } finally {
      setValidating(false);
    }
  }


  if (status === 'success') {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <AlertSuccess title={`Welcome ${username}!`} className="!block !p-4 w-full max-w-md" green={true}>
          Redirecting....
        </AlertSuccess>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[400px] px-4">
      <div className="flex flex-col w-full max-w-md space-y-6">

        {error && (
          <AlertError title="ERROR" className="!block !p-4 w-full">
            {error}
          </AlertError>
        )}

        {createdAccount === 'successful' && !error && (
          <AlertSuccess title="Success" className="!block !p-4 w-full" green={true}>
            <div className="space-y-3">
              <p>
                Account was created successfully. Please check your email to verify your account. 
                Did not receive your email? Check spam or click below to resend.
              </p>
            </div>
          </AlertSuccess>
        )}

        <EmailVerificationForm username={username} onValidate={handleValidate} isValidating={validating}/>

      </div>
    </div>
  );

}

export default EmailVerification