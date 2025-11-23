// src/components/TemplateContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

export interface Template {
  id: string;
  name: string;
  content: string;
}

interface TemplateContextType {
  templates: Template[];
  addTemplate: (template: Template) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(
  undefined
);

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplates must be used within TemplateProvider");
  }
  return context;
};

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  const addTemplate = (template: Template) => {
    setTemplates((prev) => [...prev, template]);
  };

  const updateTemplate = (template: Template) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? template : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TemplateContext.Provider
      value={{ templates, addTemplate, updateTemplate, deleteTemplate }}
    >
      {children}
    </TemplateContext.Provider>
  );
};
