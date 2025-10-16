import * as React from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from "@/lib/utils"

const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
	const [showPassword, setShowPassword] = React.useState(false)
	const hidden = props.value === '' || props.value === undefined || props.disabled

	return (
		<div className="relative">
			<Input type={showPassword ? 'text' : 'password'}
					className={cn('hide-password-toggle pr-10', className)} {...props} />
			{hidden || <Button type="button" variant="ghost" size="sm"
				className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
				onClick={() => setShowPassword((prev) => !prev)} >
				{showPassword ? (
					<EyeIcon className="h-4 w-4" aria-hidden="true" />
				) : (
					<EyeOffIcon className="h-4 w-4" aria-hidden="true" />
				)}
				<span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
			</Button>}

			{/* hides browsers password toggles */}
			<style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
		</div>
	)
})


export { PasswordInput }