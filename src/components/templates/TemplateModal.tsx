import { useState, useEffect, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useTemplates, Template } from "../../context/TemplatesContext";
import { v4 as uuidv4 } from "uuid";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTemplate: Template | null;
}

export default function TemplateModal({ isOpen, onClose, editTemplate }: TemplateModalProps) {
  const { addTemplate, updateTemplate } = useTemplates();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setContent(editTemplate.content);
    } else {
      setName("");
      setContent("");
    }
  }, [editTemplate]);

  const handleSave = () => {
    if (!name || !content) return; // basic validation

    if (editTemplate) {
      updateTemplate({ ...editTemplate, name, content });
    } else {
      addTemplate({ id: uuidv4(), name, content });
    }

    // reset form and close modal
    setName("");
    setContent("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editTemplate ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Input
            placeholder="Template Name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Template Content"
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            rows={6}
          />
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{editTemplate ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
