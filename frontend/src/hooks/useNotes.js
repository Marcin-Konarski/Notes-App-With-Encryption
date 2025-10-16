import { useCallback, useState } from 'react'
import { useNotesContext } from '@/hooks/useNotesContext';
import NotesService from '@/services/NotesService';
import UserService from '@/services/UserService';
import { useUserContext } from './useUserContext';

const useNotes = () => {
    const { notes, updateNotes, updateNote, addNote, removeNote } = useNotesContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await NotesService.fetchNotes();
            updateNotes(response.data);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch notes';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createNote = useCallback(async (data) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await NotesService.createNote(data);
            addNote({...response.data, permission: 'O'});
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.non_field_errors || err.response?.data || 'Failed to create note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createEncryptedNote = useCallback(async (data, encryption_key) => {
        setIsLoading(true);
        setError(null);

        const newData = {
            ...data,
            is_encrypted: true,
            encryption_key: encryption_key,
        }

        try {
            const response = await NotesService.createNote(newData);
            addNote({...response.data, permission: 'O'}); // Add owner permission here as well in order to render newly created notes in the `My notes` section
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.non_field_errors || err.response?.data || 'Failed to create note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveUpdateNote = useCallback(async (noteId, json) => {
        setError(null);

        try {
            updateNote(noteId, json); // Update note in memory regardless of whether saving to backend was successful or not
            const response = await NotesService.updateNote(noteId, json);
            return {success: true }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);

    const deleteNote = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);

        try {
            await NotesService.deleteNote(id);
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const removeAccess = useCallback(async (noteId, userId) => {
        setIsLoading(true);
        setError(null);

        try {
            await NotesService.removeAccess({note: noteId, user: userId});
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete note';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // This is used to retrieve list of users to whom note may be shared to. Thus this function should be in useNotes.jsx and not in useAuth.jsx
    const listUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await UserService.getUsersList();
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to obtain list of users';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const shareNote = useCallback(async (noteId, user, permission) => {
        setIsLoading(true);
        setError(null);

        const data = {
            'user': user.id,
            'encryption_key': 'random encryption key useNotes.jsx',
            'permission': permission
        }

        try {
            const response = await NotesService.shareNote(noteId, data);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to obtain list of users';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { fetchNotes, createNote, createEncryptedNote, saveUpdateNote, deleteNote, removeAccess, listUsers, shareNote, isLoading, error }
}

export default useNotes