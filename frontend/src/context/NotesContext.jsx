import { createContext, useCallback, useMemo, useState } from 'react'


export const NotesContext = createContext(undefined);

export const NotesProvider = ({ children }) => {
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState({});

    const myNotes = useMemo(() => {
        return notes.filter(note => note.permission === 'O')
    }, [notes]);

    const sharedNotes = useMemo(() => {
        return notes.filter(note => note.permission !== 'O')
    }, [notes]);

    const storageNoteIdKey = 'currentNoteId';

    const updateNotes = useCallback((data) => {
        setNotes(data);
    }, []);

    const updateNote = useCallback((noteId, data) => {
        setNotes(notes => notes.map(note => note.id === noteId ? {...note, body: data.body, title: data.title} : note));
    }, []);

    const addNote = useCallback((data) => {
        setNotes(notes => [...notes, data])
        setCurrentNote(data);
    }, []);

    const removeNote = useCallback((noteId) => {
        setNotes(notes => notes.filter(note => note.id !== noteId))
    }, []);

    const values = useMemo(() => ({
        notes,
        myNotes,
        sharedNotes,
        storageNoteIdKey,
        currentNote,
        setCurrentNote,
        updateNote,
        updateNotes,
        addNote,
        removeNote,
    }), [notes, myNotes, sharedNotes, currentNote]);

    return (
        <NotesContext.Provider value={values}>
            {children}
        </NotesContext.Provider>
    );
};