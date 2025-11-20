import { useState } from 'react';
import { useTemplates } from '@/context/TemplatesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTemplate?: { id: string; name: string; content: string } | null;
}

export default function TemplateModal({
  isOpen,
  onClose,
  editTemplate = null,
}: TemplateModalProps) {
  const { addTemplate, updateTemplate } = useTemplates();
  const [name, setName] = useState(editTemplate?.name || '');
  const [content, setContent] = useState(editTemplate?.content || '');

  const handleSubmit = () => {
    if (!name.trim() || !content.trim()) return;

    if (editTemplate) {
      updateTemplate(editTemplate.id, name, content);
    } else {
      addTemplate(name, content);
    }
    setName('');
    setContent('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTemplate ? 'Edit Template' : 'New Template'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Update"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Use {DATE}, {PLATFORM}, {USERNAME} as variables"
              rows={8}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
