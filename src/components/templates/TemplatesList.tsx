// src/components/templates/TemplatesList.tsx
import { Template } from "../../context/TemplatesContext";
import { Button } from "../ui/button";

interface TemplatesListProps {
  onSelect: (content: string) => void;
  onEdit: (template: Template) => void;
  onCreate: () => void;
}

const dummyTemplates: Template[] = [
  { id: "1", name: "Hello", content: "Hello World!" },
  { id: "2", name: "Promo", content: "Check our new promo!" },
];

export default function TemplatesList({ onSelect, onEdit, onCreate }: TemplatesListProps) {
  return (
    <div className="grid gap-2">
      {dummyTemplates.map((template) => (
        <div
          key={template.id}
          className="flex justify-between items-center border p-2 rounded"
        >
          <span>{template.name}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onSelect(template.content)}>
              Use
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(template)}>
              Edit
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onCreate}>
        + New Template
      </Button>
    </div>
  );
}
