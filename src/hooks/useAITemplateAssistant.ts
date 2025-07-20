import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useAITemplateAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (prompt: string, htmlContent?: string, templateName?: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-template-assistant', {
        body: {
          prompt,
          htmlContent,
          context: templateName ? `Template: ${templateName}` : undefined,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr AI-Assistent für PDF-Templates. Ich kann Ihnen dabei helfen, HTML/CSS-Templates zu erstellen, zu verbessern und Probleme zu beheben. Wie kann ich Ihnen heute helfen?',
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    addWelcomeMessage,
  };
};