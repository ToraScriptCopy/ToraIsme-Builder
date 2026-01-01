import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, X, Loader2, FileCode2, ChevronDown } from 'lucide-react';
import { ChatMessage, UIWindow, EditorFile } from '../types';

interface AIChatProps {
  files: EditorFile[];
  activeFileId: string;
  onApplyCode: (fileId: string, newData: UIWindow) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ files, activeFileId, onApplyCode, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I create real Roblox scripts. Ask me for a "Speed Button" or "ESP" and I will write the actual logic.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetFileId, setTargetFileId] = useState(activeFileId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep target file synced with active file unless manually changed
  useEffect(() => {
    if (files.find(f => f.id === activeFileId)) {
        setTargetFileId(activeFileId);
    }
  }, [activeFileId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // Get context of the target file
    const targetFile = files.find(f => f.id === targetFileId) || files[0];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemPrompt = `
      You are an expert Roblox Lua Scripter and UI Designer.
      
      TARGET CONTEXT:
      File Name: ${targetFile.name}
      Current UI JSON: ${JSON.stringify(targetFile.data)}

      CRITICAL RULES:
      1. REAL LOGIC ONLY: Do NOT use comments like "-- insert logic here". Write the actual Roblox Lua code.
         - Example: If asked for speed, write "game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = 100".
         - Example: If asked for Kill, write "game.Players.LocalPlayer.Character.Humanoid.Health = 0".
      2. PERSISTENCE: Put the Lua code inside the "customLogic" field of the element.
      3. UI UPDATES: Return JSON to update the UI structure.
      
      Expected JSON Structure:
      {
        "folders": [
            { 
              "id": "...", 
              "text": "Tab Name", 
              "elements": [ 
                { 
                  "type": "Button", 
                  "text": "Speed 100", 
                  "id": "...",
                  "customLogic": "game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = 100\\nprint('Speed set')"
                } 
              ] 
            }
        ]
      }
      
      If the user just asks a question, answer in text. If they ask for UI/Features, return JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
            systemInstruction: systemPrompt
        }
      });

      const text = response.text || "I couldn't generate a response.";
      
      try {
        const potentialJson = text.trim();
        const start = potentialJson.indexOf('{');
        const end = potentialJson.lastIndexOf('}');
        
        if (start !== -1 && end !== -1) {
             const jsonStr = potentialJson.substring(start, end + 1);
             const newData = JSON.parse(jsonStr);
             
             // Merge logic
             if (newData.folders && Array.isArray(newData.folders)) {
                 const mergedData = { ...targetFile.data, ...newData };
                 onApplyCode(targetFileId, mergedData);
                 setMessages(prev => [...prev, { role: 'model', text: `I've updated "${targetFile.name}" with real working logic!` }]);
                 setIsLoading(false);
                 return;
             }
        }
      } catch (e) {
        // Not JSON
      }

      setMessages(prev => [...prev, { role: 'model', text: text }]);

    } catch (error: any) {
      console.error(error);
      let errMsg = "Error connecting to AI.";
      if (error.message && error.message.includes("404")) errMsg = "AI Model not available currently.";
      setMessages(prev => [...prev, { role: 'model', text: errMsg, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 right-4 w-96 h-[550px] bg-[#1e1e1e] border border-[#007acc] rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-10 bg-[#007acc] flex items-center justify-between px-3 text-white">
        <div className="flex items-center gap-2">
            <Bot size={18} />
            <span className="font-bold text-sm">Tora AI</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <X size={16} />
        </button>
      </div>

      {/* Target File Selector */}
      <div className="bg-[#252526] px-3 py-2 border-b border-[#333] flex items-center gap-2">
         <FileCode2 size={14} className="text-[#cccccc]" />
         <div className="relative flex-1">
            <select 
                value={targetFileId} 
                onChange={(e) => setTargetFileId(e.target.value)}
                className="w-full bg-[#3c3c3c] text-white text-xs px-2 py-1 rounded outline-none appearance-none cursor-pointer border border-[#444] focus:border-[#007acc]"
            >
                {files.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-white pointer-events-none" />
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1e1e1e]">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                    className={`max-w-[85%] rounded px-3 py-2 text-sm whitespace-pre-wrap
                    ${msg.role === 'user' 
                        ? 'bg-[#007acc] text-white' 
                        : 'bg-[#252526] text-[#cccccc] border border-[#333]'
                    }
                    ${msg.isError ? 'border-red-500 text-red-400' : ''}
                    `}
                >
                    {msg.text}
                </div>
            </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-[#252526] px-3 py-2 rounded border border-[#333]">
                    <Loader2 size={16} className="animate-spin text-[#007acc]" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#252526] border-t border-[#333] flex gap-2">
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ex: Add a WalkSpeed slider..."
            className="flex-1 bg-[#3c3c3c] text-white text-sm px-3 py-2 rounded outline-none border border-transparent focus:border-[#007acc]"
        />
        <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-[#007acc] hover:bg-[#0063a5] text-white p-2 rounded transition-colors disabled:opacity-50"
        >
            <Send size={16} />
        </button>
      </div>
    </div>
  );
};