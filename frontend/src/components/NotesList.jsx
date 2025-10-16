import { useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/tiptap-ui-primitive/input/input"
import { ButtonGroup } from "@/components/ui/ButtonGroup"
import { ScrollArea } from "@/components/ui/ScrollArea"
import NotesDropdownMenu from "@/components/NotesDropdownMenu"
import DisappearingAlert from "@/components/DisappearingAlert"
import { useNotesContext } from "@/hooks/useNotesContext"
import useNotes from "@/hooks/useNotes"
import { cn } from "@/lib/utils"


const NotesList = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { saveUpdateNote } = useNotes();
    const { myNotes, sharedNotes, storageNoteIdKey, setCurrentNote } = useNotesContext();
    const [activeTab, setActiveTab] = useState('my');
    const [isRenaming, setIsRenaming] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [renameError, setRenameError] = useState(null);

    const handleRename = useCallback(async (item) => {
        if (!newTitle.trim() || newTitle === item.title) {
            setIsRenaming(null);
            setNewTitle("");
            return;
        }

        const status = await saveUpdateNote(item.id, { title: newTitle, body: item.body });
        if (status.error) {
            setRenameError(status.error);
            setNewTitle(item.title);
        }
        setIsRenaming(null);
        setNewTitle("");
    }, [newTitle, saveUpdateNote]);

    const handleNoteClick = (item) => {
        setCurrentNote(item);
        localStorage.setItem(storageNoteIdKey, item.id);
        navigate(`/notes/${item.id}`);
    };

    const displayedNotes = activeTab === 'my' ? myNotes : sharedNotes;

    return (
        <>
            {renameError && (
                <div className='absolute z-20 top-4 left-4 right-4'>
                    <DisappearingAlert title="Oops!" time="5s" variant="destructive" color="red-500">
                        {renameError}
                    </DisappearingAlert>
                </div>
            )}

            <div className="flex flex-col h-full w-full">
                {/* Tab Switch */}
                <div className="px-4 py-3 border-b">
                    <ButtonGroup className="w-full">
                        <Button variant={activeTab === 'my' ? 'default' : 'outline'} className="flex-1" onClick={() => setActiveTab('my')}>
                            My Notes ({myNotes.length})
                        </Button>
                        <Button variant={activeTab === 'shared' ? 'default' : 'outline'} className="flex-1" onClick={() => setActiveTab('shared')}>
                            Shared to Me ({sharedNotes.length})
                        </Button>
                    </ButtonGroup>
                </div>

                {/* Notes List */}
                <ScrollArea className="flex-1 h-full w-full">
                    <div className="flex flex-col w-full">
                        {displayedNotes.length > 0 ? (
                            displayedNotes.map((item) => (
                                <NoteItem key={item.id} item={item} isActive={params.noteId === item.id} isRenaming={isRenaming === item.id}
                                    newTitle={newTitle} setNewTitle={setNewTitle} onNoteClick={() => handleNoteClick(item)}
                                    onRename={() => { setIsRenaming(item.id); setNewTitle(item.title); setRenameError(null); }}
                                    onRenameComplete={() => handleRename(item)} onRenameCancel={() => { setIsRenaming(null); setNewTitle(""); }}
                                />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <p className="text-muted-foreground text-sm">
                                        {activeTab === 'my' ? 'No notes yet' : 'No shared notes'}
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        {activeTab === 'my' 
                                            ? 'Create your first note to get started'
                                            : 'Notes shared with you will appear here'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </>
    )
}

const NoteItem = ({ item, isActive, isRenaming, newTitle, setNewTitle, onNoteClick, onRename, onRenameComplete, onRenameCancel }) => {
    if (isRenaming) {
        return (
            <div className="px-4 py-3 border-b bg-accent/30">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onBlur={onRenameComplete}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onRenameComplete();
                        } else if (e.key === 'Escape') {
                            onRenameCancel();
                        }
                    }}
                    autoFocus onFocus={(e) => e.target.select()} className="h-9 text-sm"
                />
            </div>
        );
    }

    return (
        <div
            className={cn("flex items-center justify-between px-4 py-3 border-b transition-colors cursor-pointer",
                isActive
                    ? "bg-accent/60" 
                    : "hover:bg-accent/30 active:bg-accent/50"
            )}
            onClick={() => onNoteClick(item.id)}
        >
            <div className="flex-1 min-w-0 mr-3">
                <h4 className="text-sm font-medium truncate">{item.title}</h4>
            </div>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <NotesDropdownMenu currentNote={item} onRename={onRename}/>
            </div>
        </div>
    );
};

export default NotesList