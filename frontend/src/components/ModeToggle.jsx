import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'

export function ModeToggle({ className }) {
    const { theme, setTheme } = useTheme()

    const themeToggle = () => {
        if (theme !== 'dark')
            setTheme('dark')
        else
            setTheme('light')
    }

    return (<>
        <Button variant='outline' size='icon' onClick={themeToggle}>
            <Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
            <Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
            <span className='sr-only'>Toggle theme</span>
        </Button>
    </>)
}