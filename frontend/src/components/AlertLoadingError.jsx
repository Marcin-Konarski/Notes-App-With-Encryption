import React from 'react'
import AlertSuccess from '@/components/ui/AlertSuccess'
import AlertError from '@/components/ui/AlertError'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

const AlertLoadingError = ({isLoading, error, showButton, children}) => {
  return (
    <div className='flex flex-col justify-center mb-10' style={{ width: 'clamp(300px, 20vw, 800px)' }}>
        {isLoading && (
            <AlertSuccess title={'Hold On'} className={'!block !py-4 w-full mb-5'} green={false}>
                {children}
            </AlertSuccess>
        )}

        {error && (
            <AlertError title={'Something Went Wrong'} className={'!block !py-4 w-full mb-5'}>
                <div className="w-full flex items-start justify-between gap-4">
                    <div className="text-sm leading-relaxed">
                        {error}
                    </div>
                    {showButton && error.includes('not confirmed') && (
                        <Button variant='ghost' size='sm' asChild className="shrink-0 mt-1">
                            <Link to='/verify'>Verify Account</Link>
                        </Button>
                    )}
                </div>
            </AlertError>
        )}
    </div>
  );
}

export default AlertLoadingError