import React, { useEffect, useRef } from 'react';
import { X, Terminal, Ban } from 'lucide-react';
import { LogEntry } from '../types';

interface ConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ isOpen, onClose, logs, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-[#1e1e1e] border-t border-[#333] z-40 flex flex-col font-mono shadow-up">
      {/* Header */}
      <div className="h-8 bg-[#252526] flex items-center justify-between px-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[#007acc]" />
            <span className="text-xs font-bold text-[#cccccc] uppercase">Output Console</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onClear} className="text-gray-400 hover:text-white p-1" title="Clear Console">
                <Ban size={14} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <X size={14} />
            </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 && (
            <div className="text-gray-600 text-xs italic px-2">Console is ready. Press "Run Script" to test logic.</div>
        )}
        {logs.map((log, idx) => (
            <div key={idx} className={`text-xs px-2 py-0.5 flex gap-2 font-mono border-b border-transparent hover:bg-[#333]/30
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'warn' ? 'text-yellow-400' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'info' ? 'text-gray-300' : ''}
            `}>
                <span className="opacity-50 select-none">[{log.timestamp}]</span>
                <span>{log.message}</span>
            </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};