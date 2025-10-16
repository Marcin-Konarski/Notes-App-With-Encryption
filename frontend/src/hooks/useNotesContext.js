import { useContext } from "react";
import { NotesContext } from "@/context/NotesContext";


export function useNotesContext() {
    const context = useContext(NotesContext);

    if (context === undefined) {
        throw new Error('useNotesContext must be used with UserContext');
    }

    return context;
}