import React from 'react';
import { X, History, ExternalLink, Github, FileText, Shield } from 'lucide-react';
import { SavedScript, UIWindow } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: SavedScript[];
  onLoadScript: (data: UIWindow) => void;
}

export const SidebarMenu: React.FC<Props> = ({ isOpen, onClose, history, onLoadScript }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      
      {/* Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-[#252526] border-l border-[#333] z-50 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#333] bg-[#1e1e1e]">
                <h2 className="font-bold text-white tracking-wide">MENU</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* External Links */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#6e7681] uppercase mb-2">Tools</h3>
                    <a href="https://wearedevs.net/obfuscator" target="_blank" rel="noreferrer" 
                       className="flex items-center gap-3 px-3 py-2 bg-[#333]/50 hover:bg-[#007acc] text-gray-200 hover:text-white rounded transition-colors group">
                        <ExternalLink size={16} />
                        <span className="text-sm">Lua Obfuscator</span>
                    </a>
                </div>

                {/* History */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#6e7681] uppercase mb-2 flex items-center gap-2">
                        <History size={12} /> Local History
                    </h3>
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No scripts saved yet.</p>
                        ) : (
                            history.map(script => (
                                <button 
                                    key={script.id}
                                    onClick={() => { onLoadScript(script.data); onClose(); }}
                                    className="w-full text-left px-3 py-2 bg-[#333]/30 hover:bg-[#333] rounded border border-transparent hover:border-[#007acc] group"
                                >
                                    <div className="text-sm text-gray-200 font-medium group-hover:text-[#007acc] transition-colors">{script.name}</div>
                                    <div className="text-[10px] text-gray-500">{new Date(script.timestamp).toLocaleString()}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#333] bg-[#1e1e1e] space-y-3">
                 <div className="flex items-center gap-2 text-xs text-gray-500 hover:text-white cursor-pointer transition-colors">
                    <Shield size={12} />
                    <span>Privacy Policy & Terms</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-500 hover:text-white cursor-pointer transition-colors">
                    <Github size={12} />
                    <span>Source Code</span>
                 </div>
                 <div className="text-[10px] text-[#444] mt-2">
                    &copy; 2026 ToraIsme Builder. All rights reserved.
                 </div>
            </div>
        </div>
      </div>
    </>
  );
};