import { createContext, useContext, useState, ReactNode } from 'react';

interface Template {
  id: string;
  name: string;
  content: string;
}

interface TemplatesContextType {
  templates: Template[];
  addTemplate: (name: string, content: string) => void;
  updateTemplate: (id: string, name: string, content: string) => void;
  deleteTemplate: (id: string) => void;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export const TemplatesProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('postTemplates');
    return saved ? JSON.parse(saved) : [];
  });

  const saveToStorage = (newTemplates: Template[]) => {
    localStorage.setItem('postTemplates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const addTemplate = (name: string, content: string) => {
    const newTemplate = {
      id: Date.now().toString(),
      name,
      content,
    };
    saveToStorage([...templates, newTemplate]);
  };

  const updateTemplate = (id: string, name: string, content: string) => {
    saveToStorage(
      templates.map((t) => (t.id === id ? { ...t, name, content } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    saveToStorage(templates.filter((t) => t.id !== id));
  };

  return (
    <TemplatesContext.Provider
      value={{ templates, addTemplate, updateTemplate, deleteTemplate }}
    >
      {children}
    </TemplatesContext.Provider>
  );
};

export const useTemplates = () => {
  const context = useContext(TemplatesContext);
  if (!context) throw new Error('useTemplates must be used within TemplatesProvider');
  return context;
};
