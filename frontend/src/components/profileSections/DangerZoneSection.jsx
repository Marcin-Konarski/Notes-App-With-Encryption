import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

import useAuth from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DialogInfo from '@/components/DialogInfo';
import { cognitoDeleteUser } from '@/cryptography/AWS_Cognito/Cognito';

const DangerZoneSection = () => {
    const { deleteUser } = useAuth();
    const navigate = useNavigate();
    const [showDialog, setShowDialog] = useState(false);

    const handleClick = () => {
        setShowDialog(true);
    };

    const handleDialogClick = async () => {
        setShowDialog(false);
        const status = await deleteUser();
        if (status.success) {
            await cognitoDeleteUser();
            navigate('/login');
        }
    };

    return (
        <>
            <DialogInfo open={showDialog} setOpen={setShowDialog} title='Delete account forever'
                description='This Action is irreversible. Are you sure you want to delete your account?'
                button='Delete' onClick={handleDialogClick} />
            <div className="space-y-6" style={{ width: 'clamp(300px, 40vw, 600px)' }}>
                <Card>
                    <CardHeader>
                        <CardTitle>Danger Zone</CardTitle>
                        <CardDescription>
                            Those actions are irreversible
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-sm border p-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h4 className="font-medium">Delete Account</h4>
                                    <p className="text-muted-foreground text-sm">
                                        This will forever delete your account
                                    </p>
                                </div>
                            </div>
                            <Button variant='destructive' onClick={handleClick}>Delete</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default DangerZoneSection