import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EllipsisVertical, SquarePen, Trash2, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropDownMenu'
import useNotes from '@/hooks/useNotes'
import DialogNotes from '@/components/DialogNotes'
import { useNotesContext } from '@/hooks/useNotesContext'
import { useUserContext } from '@/hooks/useUserContext'

const NotesDropdownMenu = ({ currentNote, onRename }) => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { removeNote } = useNotesContext();
  const { deleteNote, removeAccess, listUsers, shareNote, isLoading, error } = useNotes();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const sharingPermissions = ['O', 'S'];

  const handleDelete = async () => {
    let result
    if (currentNote.permission === 'O') {
      result = await deleteNote(currentNote.id);
    } else {
      result = await removeAccess(currentNote.id, user.id);
    }

    if (result.success) {
      removeNote(currentNote.id);
      setShowDeleteDialog(false)
      navigate('/notes')
    }
  }

  const handleGetUsers = async () => {
    const result = await listUsers()

    if (result.success) {
      const updatedUsers = result.data.filter(u => u.id !== user.id && u.username !== currentNote.owner); // User list without user that is logged in (no point sharing to myself)
      setUsersList(updatedUsers)
      setShowShareDialog(true)
    }
  }

  const handleShare = async (user, permission) => {
    const result = await shareNote(currentNote.id, user, permission)

    if (result.success) {
      setShowShareDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='p-0 m-0 size-7 rounded-md hover:bg-muted' variant='ghost'>
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem className='cursor-pointer' onClick={onRename}>
              <span className="flex items-center justify-between w-full">
                Rename
                <SquarePen className="size-4" />
              </span>
            </DropdownMenuItem>

            {sharingPermissions.some(perm => perm === currentNote.permission) &&
              <DropdownMenuItem className='cursor-pointer' onClick={handleGetUsers}>
                <span className="flex items-center justify-between w-full">
                  Share
                  <Share2 className="size-4"/>
                </span>
              </DropdownMenuItem>
            }
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem className='cursor-pointer text-destructive focus:text-destructive' onClick={() => setShowDeleteDialog(true)}>
            <span className="flex items-center justify-between w-full">
              {currentNote.permission === 'O' ? 'Delete' : 'Remove'}
              <Trash2 className="size-4 text-destructive" />
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog for deleting notes */}
      <DialogNotes isSharing={false} showDialog={showDeleteDialog} setShowDialog={setShowDeleteDialog} currentNote={currentNote} handleOnClick={handleDelete} error={error} isPending={isLoading} />

      {/* Dialog for sharing notes */}
      <DialogNotes isSharing={true} showDialog={showShareDialog} setShowDialog={setShowShareDialog} currentNote={currentNote} handleOnClick={handleShare} onShare={handleShare} error={error} isPending={isLoading} usersList={usersList} />
    </>
  )
}

export default NotesDropdownMenu