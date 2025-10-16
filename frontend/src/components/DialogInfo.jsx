import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'


const DialogInfo = ({ open, setOpen, title, description, button, onClick }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="destructive" onClick={onClick}>{button}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}

export default DialogInfo