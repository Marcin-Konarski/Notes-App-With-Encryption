import { memo } from "react";
import { Outlet } from "react-router-dom";

import { useUserContext } from "@/hooks/useUserContext";
import { useNotesContext } from "@/hooks/useNotesContext";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/Resizable"
import NotesList from "@/components/NotesList";
import EditorAnonymous from "@/pages/EditorAnonymous";


const Notes = memo(() => {
  const { user } = useUserContext();
  const { notes } = useNotesContext();

  if (!user) {
    return <EditorAnonymous />
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className='flex-1 h-full w-full overflow-hidden lg:hidden'>
        <Outlet />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block h-full w-full">
        <ResizablePanelGroup direction="horizontal" className="w-full h-full border-t-1">
          <ResizablePanel defaultSize={18} minSize={15} maxSize={30} className='min-w-56'>
            <div className="flex w-full h-full items-start justify-start p-4">
              <div className='flex flex-col w-full gap-2'>
                <NotesList notesList={notes} />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={82}>
            <Outlet />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
});

export default Notes
