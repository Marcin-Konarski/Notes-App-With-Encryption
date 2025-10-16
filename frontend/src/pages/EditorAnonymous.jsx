import SimpleEditor from '@/components/tiptap-templates/simple/simple-editor';


const EditorAnonymous = () => {
    return (
        <div className="simple-editor-wrapper-anonymous">
            <SimpleEditor content={null}/>
        </div>
    );
}

export default EditorAnonymous