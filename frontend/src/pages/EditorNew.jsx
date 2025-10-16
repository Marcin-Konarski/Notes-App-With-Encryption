import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleEditor from '@/components/tiptap-templates/simple/simple-editor';


const EditorNew = () => {
    const navigate = useNavigate();

    const handleClose = useCallback(() => {
        navigate('/notes')
    }, [navigate])

    return (
        <div className="simple-editor-wrapper h-full w-full flex flex-col items-start justify-start">
            <div className='flex-1 h-full w-full overflow-hidden'>
                <SimpleEditor onClose={handleClose} content={null} />
            </div>
        </div>
    );
}

export default EditorNew