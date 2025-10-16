import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { CheckCircle2 } from 'lucide-react'

const AlertSuccess = ({ title, children, className, green=true }) => {
    return (
        <Alert className={className}>
            <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-chart-2' />
                <AlertTitle className={`!mb-0 ${green && 'text-chart-2'}`}>{title}</AlertTitle>
            </div>
            <AlertDescription>
                {children}
            </AlertDescription>
        </Alert>
    )
}

export default AlertSuccess
