import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, FileText, X, RefreshCw, Copy, Scissors, Clipboard, History } from 'lucide-react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'global' | 'tab';
  onClose: () => void;
  actions: {
    onRename?: () => void;
    onCloseTab?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onHistory?: () => void;
  };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, type, onClose, actions }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items: MenuItem[] = type === 'tab' ? [
    { label: 'Rename File', icon: <Edit2 size={14} />, action: actions.onRename! },
    { label: 'View File History', icon: <History size={14} />, action: actions.onHistory! },
    { label: 'Close Tab', icon: <X size={14} />, action: actions.onCloseTab!, danger: true },
  ] : [
    { label: 'Undo', icon: <RefreshCw size={14} className="rotate-180" />, action: actions.onUndo!, shortcut: 'Ctrl+Z' },
    { label: 'Redo', icon: <RefreshCw size={14} />, action: actions.onRedo!, shortcut: 'Ctrl+Y' },
    { label: 'Copy Source', icon: <Copy size={14} />, action: actions.onCopy!, shortcut: 'Ctrl+C' },
  ];

  return (
    <div 
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-[100] min-w-[180px] bg-[#252526] border border-[#333] shadow-xl rounded-sm py-1 flex flex-col text-[#cccccc] font-sans text-xs"
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => { item.action(); onClose(); }}
          className={`
            w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#007acc] hover:text-white transition-colors
            ${item.danger ? 'text-red-400 hover:bg-red-900/50' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {item.shortcut && <span className="text-[10px] opacity-50 ml-4">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
};