import React, { useState, useMemo } from 'react'
import { AlertTriangle, Search, Check } from 'lucide-react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropDownMenu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import SearchBoxUsers from './SearchBoxUsers'


const DialogNotes = ({ isSharing, showDialog, setShowDialog, currentNote, handleOnClick, error, isPending, usersList = [], onShare }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedPermission, setSelectedPermission] = useState('R')

    const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
        return []
    }

    const query = searchQuery.toLowerCase()
        return usersList.filter(user => 
            user.username.toLowerCase().startsWith(query)
        )
    }, [searchQuery, usersList])

    const handleShareClick = async () => {
        if (selectedUser && onShare) {
            await onShare(selectedUser, selectedPermission)
            setSearchQuery('')
            setSelectedUser(null)
            setSelectedPermission('R')
        }
    }

    const handleDialogClose = (open) => {
    setShowDialog(open)
        if (!open) {
            setSearchQuery('')
            setSelectedUser(null)
            setSelectedPermission('R')
        }
    }


    if (isSharing) {
        return (
            <Dialog open={showDialog} onOpenChange={handleDialogClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share Note</DialogTitle>
                        <DialogDescription>
                            Share "{currentNote?.title}" with other users by selecting their username and setting permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                            <SearchBoxUsers placeholder="Type username..." commandEmpty="No users found." heading="Users" users={usersList} selectedUser={selectedUser}
                                            onSelectUser={setSelectedUser} selectedPermission={selectedPermission} onPermissionChange={setSelectedPermission} />

                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="size-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={isPending} >
                            Cancel
                        </Button>
                        <Button onClick={handleShareClick} disabled={isPending || !selectedUser}>
                            {isPending ? 'Sharing...' : 'Share'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{currentNote.permission === 'O' ? 'Delete Note' : 'Remove access to the note'}</DialogTitle>
                    <DialogDescription>
                        {currentNote.permission === 'O'
                        ? `Are you sure you want to delete "${currentNote?.title}"? This action cannot be undone.`
                        : `Are you sure you want to remove access to the "${currentNote?.title}" note? You will have to ask note's owner in order to regain access to this note.`
                        }
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleOnClick} disabled={isPending}>
                        {currentNote.permission === 'O'
                            ? isPending ? 'Deleting...' : 'Delete'
                            : isPending ? 'Removing...' : 'Remove'
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DialogNotes