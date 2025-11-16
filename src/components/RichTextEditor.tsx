import React, { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your content...',
  maxLength = 2200
}: RichTextEditorProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const handleFormat = (format: 'bold' | 'italic' | 'underline') => {
    document.execCommand(format, false);
    switch (format) {
      case 'bold':
        setIsBold(!isBold);
        break;
      case 'italic':
        setIsItalic(!isItalic);
        break;
      case 'underline':
        setIsUnderline(!isUnderline);
        break;
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerText || '';
    if (content.length <= maxLength) {
      onChange(content);
    }
  };

  const insertHashtag = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const hashtag = document.createTextNode('#');
      range.insertNode(hashtag);
      range.setStartAfter(hashtag);
      range.setEndAfter(hashtag);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const insertMention = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const mention = document.createTextNode('@');
      range.insertNode(mention);
      range.setStartAfter(mention);
      range.setEndAfter(mention);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const charCount = value.length;

  return (
    <div className="border border-gray-800/50 rounded-lg bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-800/50">
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className={`p-1.5 rounded hover:bg-gray-800 ${isBold ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('italic')}
          className={`p-1.5 rounded hover:bg-gray-800 ${isItalic ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('underline')}
          className={`p-1.5 rounded hover:bg-gray-800 ${isUnderline ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
          title="Underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-800/50 mx-1"></div>
        <button
          type="button"
          onClick={insertHashtag}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-400"
          title="Insert Hashtag"
        >
          <span className="font-bold">#</span>
        </button>
        <button
          type="button"
          onClick={insertMention}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-400"
          title="Insert Mention"
        >
          <span className="font-bold">@</span>
        </button>
      </div>

      {/* Editor */}
      <div
        className="p-3 min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none relative"
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        style={{ 
          whiteSpace: 'pre-wrap',
          color: 'white',
          caretColor: 'white'
        }}
      >
        {!value && (
          <div className="absolute top-3 left-3 text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Character count */}
      <div className="flex justify-between items-center p-2 border-t border-gray-800/50 text-xs text-gray-500">
        <div>
          {charCount}/{maxLength} characters
        </div>
        <div>
          {charCount > maxLength && (
            <span className="text-red-500">Character limit exceeded</span>
          )}
        </div>
      </div>
    </div>
  );
}