import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";

import useAuth from "@/hooks/useAuth";
import { useUserContext } from "@/hooks/useUserContext";
import { UpdatePasswordSchema, UpdateUserDataSchema } from "@/lib/ValidationSchema";
import AppearanceSection from "@/components/profileSections/AppearanceSection";
import PasswordSection from "@/components/profileSections/PasswordSection"
import PersonalSection from "@/components/profileSections/PersonalSection"
import DangerZoneSection from "@/components/profileSections/DangerZoneSection";
import DisappearingAlert from "@/components/DisappearingAlert";


const Profile = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { updateUser, changePassword, error } = useAuth();
  const [responseData, setResponseData] = useState('');
  const [responseState, setResponseState] = useState('none'); // I need 3 states: one for displaying message on success, one for displaying message on error one for not displaying anything

  useEffect(() => { // If user is logged out move him out of the profile page - only logged in users have access to profile page
    if (!user)
      navigate(-1);
  }, [user])

  useEffect(() => {
    if (responseState !== 'none') {
      const timer = setTimeout(() => {
        setResponseState('none');
        setResponseData('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [responseState])

  const onDetailsSubmit = async (data) => {
    const result = await updateUser(data);
    if (result.success) {
      setResponseState('success');
      setResponseData(result.response)
    } else {
      setResponseState('error');   
    }
  }

  const detailsForm = useForm({
    resolver: zodResolver(UpdateUserDataSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    }
  });

  const detailsInputs = [
    {
      name: 'username',
      type: 'string'
    },
    {
      name: 'email',
      type: 'email'
    },
  ]



  const onPasswordSubmit = async (data) => {
    const result = await changePassword(data);
    if (result.success) {
        setResponseState('success');
        setResponseData('Password updated successfully!');
    } else {
        setResponseState('error');
        setResponseData(result.error);
    }
  };

  const passwordForm = useForm({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const passwordInputs = [
    {
      name: "currentPassword",
      type: "password",
      label: "Current password",
      placeholder: "••••••••",
    },
    {
      name: "newPassword",
      type: "password",
      label: "New password",
      placeholder: "••••••••",
    },
    {
      name: "confirmPassword",
      type: "password",
      label: "Confirm new password",
      placeholder: "••••••••",
    },
  ];



  return (<>
    <div className='flex flex-col space-y-8 mb-20 md:mt-20'>
        <PersonalSection form={detailsForm} inputs={detailsInputs} onSubmit={onDetailsSubmit} button='Save' />
        <PasswordSection form={passwordForm} inputs={passwordInputs} onSubmit={onPasswordSubmit} button="Save" />
        <AppearanceSection />
        <DangerZoneSection />
    </div>
    {responseState === 'success' && <div className='absolute z-20'>
        <DisappearingAlert title="Success!" time="5s" variant="default" color='green-600'>
          {typeof responseData === 'string'
            ? responseData
            : 'Profile updated successfully!'
          }
          </DisappearingAlert>
      </div>}
    {responseState === 'error' && <div className='absolute z-20'>
      <DisappearingAlert title="Oops!" time="5s" variant="destructive" color="red-500">{error}</DisappearingAlert>
    </div>}
  </>);
}

export default Profile
