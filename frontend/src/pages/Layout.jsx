import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { UserProvider } from '@/context/UserContext'
import { NotesProvider } from '@/context/NotesContext'
import NavBar from '@/components/NavBar/NavBar'
import useAuth from '@/hooks/useAuth'
import useNotes from '@/hooks/useNotes'
import { useNotesContext } from '@/hooks/useNotesContext'
import { useUserContext } from '@/hooks/useUserContext'


export const LayoutOutlet = () => {
    const { loginOnPageRefresh } = useAuth();
    const { fetchNotes } = useNotes();
    const { user } = useUserContext();
    const { notes, updateNotes, setCurrentNote, storageNoteIdKey } = useNotesContext();

    useEffect(() => {
        const init = async () => {
            const status = await loginOnPageRefresh();
            if (status.success) {
                await fetchNotes();
                const currentNoteId = localStorage.getItem(storageNoteIdKey);
                setCurrentNote(notes.find(note => note.id === currentNoteId));
            }
        }
	init();
    }, [])

    useEffect(() => {
        if (!user) {
            updateNotes([]);
        }
    }, [user])

    return (
        <div className='h-screen flex flex-col'>
            <NavBar />
            <div id='main' className='flex-1 flex justify-center items-center'>
                <Outlet />
            </div>
        </div>
    );
}


const Layout = () => {

    return (
        <ThemeProvider defaultTheme='dark' storageKey='ui-theme'>
            <UserProvider>
                <NotesProvider>
                    <LayoutOutlet />
                </NotesProvider>
            </UserProvider>
        </ThemeProvider>
    );
}

export default Layout
