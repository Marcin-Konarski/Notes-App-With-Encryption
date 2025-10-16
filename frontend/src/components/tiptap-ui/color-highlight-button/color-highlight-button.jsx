import * as React from "react"

// --- Lib ---
import { parseShortcutKeys } from "@/lib/tiptap-utils"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/useTiptapEditor"

import {
  COLOR_HIGHLIGHT_SHORTCUT_KEY,
  useColorHighlight,
} from "@/components/tiptap-ui/color-highlight-button"

import { Button } from "@/components/tiptap-ui-primitive/button"
import { Badge } from "@/components/tiptap-ui-primitive/badge"

// --- Styles ---
import "@/components/tiptap-ui/color-highlight-button/color-highlight-button.scss"

export function ColorHighlightShortcutBadge({
  shortcutKeys = COLOR_HIGHLIGHT_SHORTCUT_KEY
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

/**
 * Button component for applying color highlights in a Tiptap editor.
 *
 * For custom button implementations, use the `useColorHighlight` hook instead.
 */
export const ColorHighlightButton = React.forwardRef((
  {
    editor: providedEditor,
    highlightColor,
    text,
    hideWhenUnavailable = false,
    onApplied,
    showShortcut = false,
    onClick,
    children,
    style,
    ...buttonProps
  },
  ref
) => {
  const { editor } = useTiptapEditor(providedEditor)
  const {
    isVisible,
    canColorHighlight,
    isActive,
    handleColorHighlight,
    label,
    shortcutKeys,
  } = useColorHighlight({
    editor,
    highlightColor,
    label: text || `Toggle highlight (${highlightColor})`,
    hideWhenUnavailable,
    onApplied,
  })

  const handleClick = React.useCallback((event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    handleColorHighlight()
  }, [handleColorHighlight, onClick])

  const buttonStyle = React.useMemo(() =>
    ({
      ...style,
      "--highlight-color": highlightColor
    }), [highlightColor, style])

  if (!isVisible) {
    return null
  }

  return (
    <Button
      type="button"
      data-style="ghost"
      data-active-state={isActive ? "on" : "off"}
      role="button"
      tabIndex={-1}
      disabled={!canColorHighlight}
      data-disabled={!canColorHighlight}
      aria-label={label}
      aria-pressed={isActive}
      tooltip={label}
      onClick={handleClick}
      style={buttonStyle}
      {...buttonProps}
      ref={ref}>
      {children ?? (
        <>
          <span
            className="tiptap-button-highlight"
            style={
              {
                "--highlight-color": highlightColor
              }
            } />
          {text && <span className="tiptap-button-text">{text}</span>}
          {showShortcut && (
            <ColorHighlightShortcutBadge shortcutKeys={shortcutKeys} />
          )}
        </>
      )}
    </Button>
  );
})

ColorHighlightButton.displayName = "ColorHighlightButton"
