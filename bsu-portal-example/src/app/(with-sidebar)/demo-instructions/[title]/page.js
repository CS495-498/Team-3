"use client";

import Stack, { onEntryChange } from "@/lib/cstack";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import DOMPurify from "isomorphic-dompurify";
import Tiptap from "@/components/Tiptap";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

export default function ArticleWithEditor({ params }) {
  const [entry, setEntry] = useState({});
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        onClick={() => setOpen(true)}
      >
        Edit
      </Button>

      {/* Empty Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>Edit Content</DialogTitle>
      <DialogDescription>
        Modify the content below.
      </DialogDescription>
    </DialogHeader>

    {/* Editor container */}
    <div className="w-full min-h-[300px] border border-gray-300 rounded-md p-4 bg-white">
      <SimpleEditor html={safeHTML} />
    </div>

    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}
