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

export default function ArticleWithEditor({ params }) {
  const [entry, setEntry] = useState({});
  const [open, setOpen] = useState(false);

  const getContent = async () => {
    const { title } = await params;
    const entry = await Stack.getElementByUrlWithRefs(
      "demo_instruction",
      "/demo-instructions/" + title,
      "en-us",
      []
    );
    setEntry(entry);
  };

  useEffect(() => {
    onEntryChange(getContent);
    getContent();
  }, []);

  const safeHTML = DOMPurify.sanitize(
    entry?.blog_content || "<p>No content available</p>"
  );

  return (
    <div className="p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">{entry?.title}</h1>
        <p className="text-sm text-gray-500">
          By {entry?.author_name} • Last edited{" "}
          {new Date(entry?.updated_at).toLocaleDateString()}
        </p>
      </header>

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
              This dialog is empty for now — Lexical has been removed.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[200px] flex items-center justify-center text-gray-500">
            (Editor removed — blank dialog)
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
