import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Image, Paperclip } from 'lucide-react';
import TemplateModal from './templates/TemplateModal';
import TemplatesList from './templates/TemplatesList';
import CharacterCounter from './post/CharacterCounter';
import { usePosts } from '@/context/PostsContext';
import PlatformPreview from './preview/PlatformPreview';

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchedulePostModal({ isOpen, onClose }: SchedulePostModalProps) {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<{ id: string; name: string; content: string } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('Twitter');
  const { addPost } = usePosts();

  const handleTemplateSelect = (templateContent: string) => {
    setContent(prev => prev + templateContent);
  };

  const handleTemplateEdit = (template: { id: string; name: string; content: string }) => {
    setEditTemplate(template);
    setTemplateModalOpen(true);
  };

  const handleSubmit = () => {
    // add to posts context
    try {
      const dateStr = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : '';
      addPost({
        date: dateStr,
        time: selectedTime,
        platform: selectedPlatform,
        status: 'scheduled',
        content,
      });
    } catch (e) {
      console.error('Failed to add post', e);
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Post</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Platform */}
            <div className="grid gap-2">
              <Label>Platform</Label>
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'Instagram'].map(p => (
                  <Button key={p} variant={selectedPlatform === p ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPlatform(p)}>{p}</Button>
                ))}
              </div>
            </div>

            {/* Post Content */}
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="content">Post Content</Label>
                <Button size="sm" variant="ghost" onClick={() => setTemplateModalOpen(true)}>
                  Templates
                </Button>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                rows={8}
              />
              <CharacterCounter content={content} platform={selectedPlatform} />
            </div>

            {/* Templates List */}
            <TemplatesList
              onSelect={handleTemplateSelect}
              onEdit={handleTemplateEdit}
              onCreate={() => {
                setEditTemplate(null);
                setTemplateModalOpen(true);
              }}
            />

            {/* Live Preview */}
            <div>
              <Label>Preview</Label>
              <PlatformPreview
                platform={selectedPlatform.toLowerCase() as 'twitter' | 'linkedin' | 'instagram'}
                content={content}
                username="You"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>

            {/* Attachments */}
            <div className="flex gap-3">
              <Button variant="outline" size="icon">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Schedule Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => {
          setTemplateModalOpen(false);
          setEditTemplate(null);
        }}
        editTemplate={editTemplate}
      />
    </>
  );
}
