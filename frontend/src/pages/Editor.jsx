import { useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect } from 'react';

import { useNotesContext } from '@/hooks/useNotesContext';
import SimpleEditor from '@/components/tiptap-templates/simple/simple-editor';
import Blank from '@/pages/Blank';
import useNotes from '@/hooks/useNotes';


const Editor = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { notes, currentNote, setCurrentNote } = useNotesContext();

    useEffect(() => {
        if (params?.noteId && notes.length > 0) {
            const foundNote = notes.find(note => note.id === params.noteId)
            if (foundNote) {
                setCurrentNote(foundNote);
            }
        }
    }, [notes])

    const handleClose = useCallback(() => {
        navigate('/notes')
    }, [navigate])

    if (!currentNote) {
        return <Blank />
    }

    // Set content to '' if currentNote.body is '' in order to avoid errors with JSON.parse
    let parsedContent = '';
    if (currentNote.body) {
        try {
            parsedContent = JSON.parse(currentNote.body);
        } catch {
            parsedContent = '';
        }
    };

    return (
      <SimpleEditor key={currentNote.id} onClose={handleClose} content={parsedContent} noteTitle={currentNote.title} noteId={currentNote.id} />
    )
}

export default Editor