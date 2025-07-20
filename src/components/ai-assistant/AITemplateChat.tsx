import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { useAITemplateAssistant, ChatMessage } from '@/hooks/useAITemplateAssistant';

interface AITemplateChatProps {
  htmlContent?: string;
  templateName?: string;
  onSuggestionApply?: (suggestion: string) => void;
}

export const AITemplateChat: React.FC<AITemplateChatProps> = ({
  htmlContent,
  templateName,
  onSuggestionApply,
}) => {
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, clearMessages, addWelcomeMessage } = useAITemplateAssistant();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      addWelcomeMessage();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message, htmlContent, templateName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const extractCodeFromMessage = (content: string): string | null => {
    // Extract code blocks (```html ... ```)
    const codeBlockMatch = content.match(/```(?:html|css)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // Extract inline code (`...`)
    const inlineCodeMatch = content.match(/`([^`]+)`/);
    if (inlineCodeMatch) {
      return inlineCodeMatch[1].trim();
    }
    
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-primary" />
          AI Template Assistent
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="ml-auto"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3 pt-0">
        <ScrollArea className="flex-1 h-[400px]" ref={scrollAreaRef}>
          <div className="space-y-3 pr-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 text-primary" />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'assistant' && onSuggestionApply && extractCodeFromMessage(message.content) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => onSuggestionApply!(extractCodeFromMessage(message.content)!)}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Code anwenden
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Fragen Sie nach Template-Hilfe..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Beispiele: "Wie kann ich eine Rechnung erstellen?", "Verbessere mein CSS", "Füge eine Fußzeile hinzu"
        </div>
      </CardContent>
    </Card>
  );
};