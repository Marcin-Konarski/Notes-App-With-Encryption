import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Placeholder, Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/useMobile"
import { useWindowSize } from "@/hooks/useWindowSize"
import { useCursorVisibility } from "@/hooks/useCursorVisibility"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"
import { IconButton } from '@/components/ui/Button'
import { useUserContext } from '@/hooks/useUserContext'
import { useNotesContext } from '@/hooks/useNotesContext'
import { XIcon } from 'lucide-react'

// --- Debounce library to improve performace of this editor ---
import { useDebouncedCallback } from 'use-debounce'
import useNotes from '@/hooks/useNotes'

const MainToolbarContent = memo(({ onHighlighterClick, onLinkClick, isMobile, onClose }) => {
  return (
    <>
      {/* <Spacer /> */}
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4, 5]} portal={isMobile} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} portal={isMobile} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>
      <ToolbarSeparator />
      {/* <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup> */}
      <Spacer />
        {!isMobile && onClose && // Close Button only on desktop menu and only for existing note
            <IconButton className='mx-8 rounded-xl size-8' onClick={onClose}>
                <XIcon className='size-5' />
                <span className='sr-only'>Close</span> 
            </IconButton>}
      {isMobile && <ToolbarSeparator />}
    </>
  );
});

const MobileToolbarContent = memo(({ type, onBack }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
));

function SimpleEditor({ onClose, content = '', noteTitle, noteId }) {
  const isMobile = useIsMobile();
  const { height } = useWindowSize();
  const { user } = useUserContext();
  const { saveUpdateNote } = useNotes();
  const [mobileView, setMobileView] = useState("main");
  const toolbarRef = useRef(null);

  const extensions = useMemo(() => [
    StarterKit.configure({
      horizontalRule: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
    Selection,
    Placeholder.configure({
      placeholder: ({ editor }) => {
        const isEmpty = editor.isEmpty;
        return isEmpty ? 'Start typing here...' : '';
      },
      showOnlyCurrent: true,
      includeChildren: false,
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-empty',
    })
  ], []); // Empty dependency array - extensions don't change

  const props = useMemo(() => ({
    attributes: {
      autocomplete: "off",
      autocorrect: "off",
      autocapitalize: "off",
      "aria-label": "Main content area, start typing to enter text.",
      class: "simple-editor",
    },
  }), []);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: props,
    autofocus: 'end',
    extensions: extensions,
    content: content || '',
    onUpdate: useDebouncedCallback(() => {
      const body = JSON.stringify(editor.getJSON());
      saveUpdateNote(noteId, {title: noteTitle, body: body});
    }, 500)
  }, [extensions, props])


  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper overflow-y-auto overflow-x-hidden h-full">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}>
          {mobileView === "main" ? (
            <MainToolbarContent onHighlighterClick={() => setMobileView("highlighter")} onLinkClick={() => setMobileView("link")}
              isMobile={isMobile} className='!bg-background' onClose={onClose}/>
          ) : (
            <MobileToolbarContent type={mobileView === "highlighter" ? "highlighter" : "link"} onBack={() => setMobileView("main")} />
          )}
        </Toolbar>

        <EditorContent editor={editor} role="presentation" className={user ? `simple-editor-content` : 'simple-editor-content-anonymous'} />
      </EditorContext.Provider>
    </div>
  );
}

export default memo(SimpleEditor)