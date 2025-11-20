"use client";

import Stack, { onEntryChange } from "@/lib/cstack";
import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import DOMPurify from "isomorphic-dompurify";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

export default function ArticleWithEditor({ params }) {
  const [entry, setEntry] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogEditorContent, setDialogEditorContent] = useState("");
  const editorRef = useRef(null);
  const getContent = async () => {
    const { title } = await params;
    const entry = await Stack.getElementByUrlWithRefs(
      "demo_instruction",
      "/demo-instructions/" + title,
      "en-us",
      []
    );
    setEntry(entry);
    setIsLoading(false);
  };

  useEffect(() => {
    onEntryChange(getContent);
    getContent();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  const safeHTML = DOMPurify.sanitize(
    entry?.blog_content ||
    `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
        font-size: 1rem;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="22" y1="22" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="10" x2="14" y2="10"></line>
          <line x1="8" y1="14" x2="12" y2="14"></line>
        </svg>

        <p style="max-width: 300px;">
          There’s no content here yet.  
          Check back later or add some!
        </p>
      </div>
    `
  );

  return (
    <div className="p-6">
      {/* Header */}
      {entry?.title && (
        <header className="max-w-4xl mx-auto mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{entry.title}</h1>
          {entry?.author_name && entry?.updated_at && (
            <p className="text-sm text-gray-500">
              By {entry.author_name} • Last edited{" "}
              {new Date(entry.updated_at).toLocaleDateString()}
            </p>
          )}
        </header>
      )}

      {/* Article content */}
      <article className="prose prose-stone dark:prose-invert mx-auto my-0 max-w-4xl">
        <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
      </article>

      {/* Floating Edit Button */}
      <Button
        className="fixed bottom-6 right-6 z-50"
        onClick={() => {
          setDialogEditorContent(entry.blog_content || safeHTML); // load current content
          setIsOpen(true);
        }}
      >
        Edit
      </Button>

      {/* Empty Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-0"
      >
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Panel */}
        <DialogPanel className="relative w-full max-w-[95vw] md:max-w-[80vw] lg:max-w-[80vw] max-h-[95vh] overflow-auto rounded-xl bg-white shadow-lg p-6 z-50 dark:bg-gray-700">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl font-bold dark:bg-gray-700">
              Edit Content
            </DialogTitle>

            <div className="flex gap-2">
              <Button
  onClick={async () => {
    if (!editorRef.current) return;

    const updatedHTML = editorRef.current.getHTML();
    const title = entry.title; // keep existing title
    const author = entry.author_name || "Author";

    try {
      // Call your API route that updates Contentstack
      const res = await fetch("/api/demo-instructions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: entry.uid,       // existing entry UID
          title,
          html: updatedHTML,
          author,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state so UI reflects changes immediately
        setEntry((prev) => ({
          ...prev,
          blog_content: updatedHTML,
          updated_at: new Date().toISOString(),
        }));
        setIsOpen(false);
        console.log("Saved to Contentstack:", data);
      } else {
        console.error("Failed to save:", data.error, data.details);
        alert("Failed to save content. Check console for details.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An unexpected error occurred while saving.");
    }
  }}
>
  Save
</Button>


              <Button
                onClick={() => setIsOpen(false)}
                className="bg-red-400 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>

          <Description className="text-gray-500 mb-4 dark:bg-gray-700">
            Modify the content below.
          </Description>

          {/* Editor container */}
          <div className="w-full min-h-[400px]  rounded-md p-1 bg-white dark:bg-gray-700">
            <SimpleEditor html={dialogEditorContent} editorRef={editorRef} />
          </div>

        </DialogPanel>
      </Dialog>
    </div>
  );
}

