"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 relative">
      {/* Floating Edit Button */}
      <Button
        className="fixed bottom-6 right-6 z-50"
        onClick={() => setIsOpen(true)}
      >
        Edit
      </Button>

      {/* Modal */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Panel */}
        <DialogPanel className="relative w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] overflow-auto rounded-xl bg-white shadow-lg p-6 z-50">
          <DialogTitle className="text-2xl font-bold mb-2">
            Edit Content
          </DialogTitle>
          <DialogDescription className="text-gray-500 mb-4">
            Modify the content below.
          </DialogDescription>

          {/* Editor container */}
          <div className="w-full min-h-[400px] border border-gray-300 rounded-md p-4 bg-white">
            <SimpleEditor html="<h1>Hello World</h1><p>This is a responsive Tiptap editor inside a modal.</p>" />
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-4">
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-gray-200 text-black"
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 text-white">Save</Button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
