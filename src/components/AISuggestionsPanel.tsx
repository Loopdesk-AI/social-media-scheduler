import React, { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { ToneOption, SuggestionResponse, AIError } from '../types/ai';
import { useRateLimit } from '../hooks/useRateLimit';

interface AISuggestionsPanelProps {
  onInsertSuggestion: (content: string) => void;
  currentPlatform: string;
}

const TONE_OPTIONS: { value: ToneOption; label: string; emoji: string }[] = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'friendly', label: 'Friendly', emoji: '🤝' },
  { value: 'funny', label: 'Funny', emoji: '😄' },
  { value: 'inspirational', label: 'Inspirational', emoji: '✨' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'promotional', label: 'Promotional', emoji: '🚀' },
];

export function AISuggestionsPanel({
  onInsertSuggestion,
  currentPlatform,
}: AISuggestionsPanelProps) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ToneOption>('professional');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const rateLimit = useRateLimit();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your post');
      return;
    }

    if (!rateLimit.canMakeRequest) {
      setError(
        `Rate limit reached. Please try again in ${rateLimit.getFormattedResetTime()}.`
      );
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const suggestion = await aiService.generateSuggestion({
        topic: topic.trim(),
        platform: currentPlatform,
        tone,
        context: context.trim() || undefined,
      });

      rateLimit.trackRequest();
      setSuggestions((prev) => [suggestion, ...prev]);
    } catch (err) {
      const aiError = err as AIError;
      setError(aiError.message || 'Failed to generate suggestion. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleInsert = (content: string) => {
    onInsertSuggestion(content);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Content Suggestions
        </h3>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Topic *
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Launch of new product feature"
            className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
            disabled={isGenerating}
          />
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Tone
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTone(option.value)}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  tone === option.value
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-1">{option.emoji}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context Input (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Additional Context (Optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Any specific details, keywords, or requirements..."
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 resize-none transition-colors"
            disabled={isGenerating}
          />
        </div>

        {/* Generate Button & Rate Limit Info */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !rateLimit.canMakeRequest}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Suggestion
              </>
            )}
          </button>

          <div className="text-xs text-gray-600 dark:text-gray-400">
            {rateLimit.requestsRemaining} / {rateLimit.maxRequests} requests remaining
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle size={18} className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-3 mt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Generated Suggestions
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg space-y-3"
              >
                {/* Content */}
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                  {suggestion.content}
                </p>

                {/* Metadata */}
                {suggestion.metadata && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>Model: {suggestion.metadata.model}</span>
                    {suggestion.metadata.tokensUsed && (
                      <span>• Tokens: {suggestion.metadata.tokensUsed}</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInsert(suggestion.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-md transition-colors"
                  >
                    <RefreshCw size={14} />
                    Insert
                  </button>
                  <button
                    onClick={() => handleCopy(suggestion.content, index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check size={14} className="text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

