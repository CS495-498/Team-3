"use client"

import {useEffect, useMemo, useRef, useState} from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopoverContent,
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
import { ImagePlusIcon } from "@/components/tiptap-icons/image-plus-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import Image from "@tiptap/extension-image"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import postAsset from "@/app/api/helper/postAsset.js"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"




async function uploadImageToContentstack(file, parentUid) {
  const data = await postAsset(
      file,
      file.name,     // title
      "",            // description
      parentUid,
      ""
  )

  const url =
      data?.asset?.url ||
      data?.url ||
      data?.asset?.fields?.url ||
      null

  if (!url) throw new Error("Upload succeeded but no asset URL was returned.")
  return url
}

const ImageWithUpload = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      uploadImage: null,
    }
  },

  addProseMirrorPlugins() {
    const upload = this.options.uploadImage
    if (!upload) return []

    const insert = async (view, file, pos) => {
      const src = await upload(file)
      const node = view.state.schema.nodes.image.create({ src, alt: file.name })

      const tr =
          typeof pos === "number"
              ? view.state.tr.insert(pos, node)
              : view.state.tr.replaceSelectionWith(node)

      view.dispatch(tr.scrollIntoView())

      // optional: add a space after so cursor continues naturally
      const afterPos =
          typeof pos === "number" ? pos + node.nodeSize : view.state.selection.to + 1
      view.dispatch(view.state.tr.insertText(" ", afterPos))
    }

    return [
      new Plugin({
        key: new PluginKey("image-upload"),
        props: {
          handlePaste(view, event) {
            const files = Array.from(event.clipboardData?.files ?? [])
            const images = files.filter((f) => f.type.startsWith("image/"))
            if (!images.length) return false

            event.preventDefault()
            images.forEach((file) => void insert(view, file))
            return true
          },

          handleDrop(view, event, _slice, moved) {
            if (moved) return false

            const files = Array.from(event.dataTransfer?.files ?? [])
            const images = files.filter((f) => f.type.startsWith("image/"))
            if (!images.length) return false

            event.preventDefault()
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
            const pos = coords?.pos ?? view.state.selection.from

            images.forEach((file) => void insert(view, file, pos))
            return true
          },
        },
      }),
    ]
  },
})

function ImageInsertButton({ editor, uploadImage }) {
  const inputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)

  return (
      <>
          <Button
              type="button"
              data-style="ghost"
              title={isUploading ? "Uploading image" : "Insert image"}
              aria-label={isUploading ? "Uploading image" : "Insert image"}
              disabled={isUploading}
              onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
              }}
              onClick={(e) => {
                  if (isUploading) return
                  e.preventDefault()
                  e.stopPropagation()
                  inputRef.current?.click()
              }}
          >
              {isUploading ? (
                  <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      <span className="text-xs">Uploading...</span>
                  </span>
              ) : (
                  <ImagePlusIcon className="tiptap-button-icon" />
              )}
          </Button>

        <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || !editor || !uploadImage) return

              try {
                setIsUploading(true)
                const url = await uploadImage(file)

                editor.chain().focus().setImage({ src: url, alt: file.name }).run()
                editor.chain().focus().insertContent(" ").run()
              } catch (error) {
                console.error("Image upload failed:", error)
                alert(error?.message || "Image upload failed")
              } finally {
                setIsUploading(false)
                e.target.value = ""
              }
            }}
        />
      </>
  )
}

const MainToolbarContent = ({
    onLinkClick,
    isMobile,
    editor,
    enableImages,
    uploadImage,
}) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
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
      <Spacer />
      {isMobile && <ToolbarSeparator />}

        {enableImages && (
            <ToolbarGroup>
                <ImageInsertButton editor={editor} uploadImage={uploadImage} />
            </ToolbarGroup>
        )}
    </>
  );
}

const MobileToolbarContent = ({
  type,
  onBack
}) => (
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
)

export function SimpleEditor({
    html = "<p></p>",
    editorRef,
    assetParentUid,
    enableImages = true,
    uploadImage,
}) {
    const isMobile = useIsMobile()
    const { height } = useWindowSize()
    const [mobileView, setMobileView] = useState("main")
    const toolbarRef = useRef(null)
    const resolvedUploadImage = useMemo(() => {
        if (!enableImages) return null
        if (uploadImage) return uploadImage
        if (!assetParentUid) return null

        return (file) => uploadImageToContentstack(file, assetParentUid)
    }, [enableImages, uploadImage, assetParentUid])

    const extensions = useMemo(() => {
        const base = [
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
            Typography,
            Superscript,
            Subscript,
            Selection,
        ]

        if (enableImages && resolvedUploadImage) {
            base.splice(
                1,
                0,
                ImageWithUpload.configure({
                    inline: true,
                    uploadImage: resolvedUploadImage,
                })
            )
        }

        return base
    }, [enableImages, resolvedUploadImage])

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
        editorProps: {
            attributes: {
                autocomplete: "off",
                autocorrect: "off",
                autocapitalize: "off",
                "aria-label": "Main content area, start typing to enter text.",
                class: "simple-editor",
            },
        },
        extensions,
        content: html,
    })

    const rect = useCursorVisibility({
        editor,
        overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
    })

    useEffect(() => {
        if (!isMobile && mobileView !== "main") setMobileView("main")
    }, [isMobile, mobileView])

    useEffect(() => {
        if (editor && editorRef) editorRef.current = editor
    }, [editor, editorRef])

    return (
        <div className="simple-editor-wrapper w-full max-w-full h-full min-h-[300px]">
            <EditorContext.Provider value={{ editor }}>
                <Toolbar
                    ref={toolbarRef}
                    style={{
                        ...(isMobile ? { bottom: `calc(100% - ${height - rect.y}px)` } : {}),
                    }}
                >
                    {mobileView === "main" ? (
                        <MainToolbarContent
                            onHighlighterClick={() => setMobileView("highlighter")}
                            onLinkClick={() => setMobileView("link")}
                            isMobile={isMobile}
                            editor={editor}
                            enableImages={Boolean(resolvedUploadImage)}
                            uploadImage={resolvedUploadImage}
                        />
                    ) : (
                        <MobileToolbarContent
                            type={mobileView === "highlighter" ? "highlighter" : "link"}
                            onBack={() => setMobileView("main")}
                        />
                    )}
                </Toolbar>

                <EditorContent
                    editor={editor}
                    role="presentation"
                    className="simple-editor-content w-full h-full min-h-[250px] overflow-auto"
                />
            </EditorContext.Provider>
        </div>
    )
}
