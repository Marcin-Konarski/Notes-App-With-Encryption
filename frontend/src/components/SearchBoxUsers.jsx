import React, { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/Command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropDownMenu'
import { Button } from '@/components/ui/Button'

const permssions = {
    R: "Read",
    W: "Write",
    S: "Share",
}

const SearchBoxUsers = ({ placeholder, commandEmpty, heading, users, onSelectUser, selectedUser, selectedPermission, onPermissionChange }) => {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return []
        }
        const query = searchQuery.toLowerCase()
        return users.filter(user => 
            user.username.toLowerCase().includes(query)
        )
    }, [searchQuery, users])

    const handleSelect = (user) => {
        onSelectUser(user)
        setSearchQuery('') // Clear search after selection
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="flex-1">
                    <Command className="border rounded-xs" shouldFilter={false}>
                        <CommandInput placeholder={placeholder} value={searchQuery} onValueChange={setSearchQuery}/>
                        {searchQuery.trim() && (
                            <CommandList>
                                <CommandEmpty>{commandEmpty}</CommandEmpty>
                                {filteredUsers.length > 0 && (
                                    <CommandGroup heading={heading}>
                                        {filteredUsers.map(user => (
                                            <CommandItem key={user.id} value={user.username} onSelect={() => handleSelect(user)} className="cursor-pointer">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{user.username}</span>
                                                    {selectedUser?.id === user.id && (
                                                        <Check className="size-4 text-primary" />
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        )}
                    </Command>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-24 rounded-xs">
                            {permssions[selectedPermission]}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => onPermissionChange('R')} className="cursor-pointer">
                                <span className="flex items-center justify-between w-full">
                                    Read
                                    {selectedPermission === 'R' && <Check className="size-4" />}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPermissionChange('W')} className="cursor-pointer">
                                <span className="flex items-center justify-between w-full">
                                    Write
                                    {selectedPermission === 'W' && <Check className="size-4" />}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPermissionChange('S')} className="cursor-pointer">
                                <span className="flex items-center justify-between w-full">
                                    Share
                                    {selectedPermission === 'S' && <Check className="size-4" />}
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {selectedUser && (
                <div className="flex items-center justify-between rounded-md border p-3 bg-muted/50">
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium">Selected User</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.username}</p>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Permission: <span className="text-foreground">{selectedPermission}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchBoxUsers