'use client'

import { useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from "@tiptap/starter-kit"
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import HardBreak from '@tiptap/extension-hard-break'
import Blockquote from '@tiptap/extension-blockquote'
import CodeBlock from '@tiptap/extension-code-block'
import HorizontalRule from '@tiptap/extension-horizontal-rule'


export default function Tiptap({ html = "<p></p>" }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,  // allow flexible document parsing
      }),
      HardBreak,
      Blockquote,
      CodeBlock,
      HorizontalRule,
      Image,
      Link.configure({
        openOnClick: true,
      }),
    ],
    content: html,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && html) {
      editor.commands.setContent(html, false)
    }
  }, [html, editor])

  return <EditorContent editor={editor} />
}