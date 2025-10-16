import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'


const DisappearingAlert = ({ title, time = '5s', variant = 'default', color, className = '', children, ...props }) => {
    const [isVisible, setIsVisible] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        // Parse time string to milliseconds
        const parseTime = (timeStr) => {
            const match = timeStr.match(/^(\d+(?:\.\d+)?)(s|ms)$/)
            if (!match) return 5000
            const [, value, unit] = match
            return unit === 's' ? parseFloat(value) * 1000 : parseFloat(value)
        }

        const timeoutDuration = parseTime(time)

        // Start fade out animation slightly before hiding
        const fadeOutTimer = setTimeout(() => {
            setIsAnimating(true)
        }, timeoutDuration - 300) // Start fade 300ms before hiding

        // Hide the component
        const hideTimer = setTimeout(() => {
            setIsVisible(false)
        }, timeoutDuration)

        return () => {
            clearTimeout(fadeOutTimer)
            clearTimeout(hideTimer)
        }
    }, [time])

    if (!isVisible) return null

    return (
        <div className="fixed top-[5vh] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert variant={variant} className={`bg-accent/75 transition-all duration-300 ease-in-out
            ${isAnimating ? 'translate-y-[-10px] scale-90' : 'translate-y-0 scale-100'} ${className}`} {...props}>
                <AlertTitle className={`text-${color}`}>{title}</AlertTitle>
                <AlertDescription className={`text-${color}`}>
                    {children}
                </AlertDescription>
            </Alert>
        </div>
    );
}


export default DisappearingAlert