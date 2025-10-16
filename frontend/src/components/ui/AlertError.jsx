import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { OctagonX } from 'lucide-react'

const AlertError = ({ title, children, className }) => {
    return (
        <Alert variant='destructive' className={className}>
            <div className='flex items-center gap-2'>
                <OctagonX className='h-4 w-4 text-destructive' />
                <AlertTitle className='!mb-0 text-destructive'>{title}</AlertTitle>
            </div>
            <AlertDescription>
                {children}
            </AlertDescription>
        </Alert>
    )
}

export default AlertError
