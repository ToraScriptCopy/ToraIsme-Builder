import React, { useState, useMemo } from 'react';
import { X, Clock, ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { EditorFile } from '../types';
import { generateLuaCode } from '../services/luaGenerator';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile: EditorFile;
  historyStack: EditorFile[][];
  onRestore: (fileState: EditorFile) => void;
}

// Simple Diff Logic
const computeDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff = [];
    
    let i = 0;
    let j = 0;

    while (i < oldLines.length || j < newLines.length) {
        if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
            diff.push({ type: 'same', text: oldLines[i] });
            i++;
            j++;
        } else if (j < newLines.length && (i >= oldLines.length || !oldLines.includes(newLines[j], i))) {
            diff.push({ type: 'added', text: newLines[j] });
            j++;
        } else if (i < oldLines.length) {
            diff.push({ type: 'removed', text: oldLines[i] });
            i++;
        } else {
            j++; 
        }
    }
    return diff;
};

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, currentFile, historyStack, onRestore }) => {
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null);

  // Filter history relevant to this file ID
  const relevantHistory = useMemo(() => {
    // Reverse logic: The latest change is at the end of historyStack. 
    // We want to map global stack snapshots to this specific file's versions.
    const snapshots: { timestamp: number, file: EditorFile, isLatest: boolean }[] = [];
    
    historyStack.forEach((stack, idx) => {
        const fileInStack = stack.find(f => f.id === currentFile.id);
        if (fileInStack) {
            // Dedup: only add if data changed from previous
            const last = snapshots[snapshots.length - 1];
            if (!last || JSON.stringify(last.file.data) !== JSON.stringify(fileInStack.data)) {
                snapshots.push({ 
                    timestamp: Date.now() - (historyStack.length - idx) * 1000, // Fake relative time for demo
                    file: fileInStack,
                    isLatest: idx === historyStack.length - 1
                });
            }
        }
    });
    return snapshots.reverse(); // Newest first
  }, [historyStack, currentFile.id]);

  if (!isOpen) return null;

  const compareTo = selectedVersionIndex !== null ? relevantHistory[selectedVersionIndex + 1] || relevantHistory[selectedVersionIndex] : null;
  const selectedSnapshot = selectedVersionIndex !== null ? relevantHistory[selectedVersionIndex] : relevantHistory[0];
  
  const currentCode = generateLuaCode(selectedSnapshot.file.data);
  const prevCode = compareTo ? generateLuaCode(compareTo.file.data) : "";
  
  const diff = computeDiff(prevCode, currentCode);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] w-full max-w-6xl h-[80vh] rounded-lg border border-[#333] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="h-14 bg-[#252526] border-b border-[#333] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <Clock className="text-[#007acc]" />
                <div>
                    <h2 className="text-white font-bold">File History</h2>
                    <p className="text-xs text-gray-500">{currentFile.name} • {relevantHistory.length} versions found</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-64 bg-[#252526] border-r border-[#333] overflow-y-auto">
                {relevantHistory.map((snap, idx) => (
                    <div 
                        key={idx}
                        onClick={() => setSelectedVersionIndex(idx)}
                        className={`p-3 border-b border-[#333] cursor-pointer hover:bg-[#2a2a2d] transition-colors
                            ${selectedVersionIndex === idx ? 'bg-[#007acc]/20 border-l-2 border-l-[#007acc]' : 'border-l-2 border-l-transparent'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${idx === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                {idx === 0 ? 'Latest' : `Version ${relevantHistory.length - idx}`}
                            </span>
                            {snap.isLatest && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                            {idx === 0 ? 'Current State' : 'Change detected'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Diff Viewer */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                {/* Toolbar */}
                <div className="h-10 border-b border-[#333] bg-[#1e1e1e] flex items-center justify-between px-4">
                    <span className="text-xs text-gray-400">Comparing Version {relevantHistory.length - (selectedVersionIndex || 0)} vs Previous</span>
                    {selectedVersionIndex !== 0 && selectedVersionIndex !== null && (
                         <button 
                            onClick={() => {
                                onRestore(selectedSnapshot.file);
                                onClose();
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-[#007acc] hover:bg-[#0063a5] text-white text-xs rounded transition-colors"
                         >
                            <RotateCcw size={12} /> Restore this Version
                         </button>
                    )}
                </div>

                {/* Code Area */}
                <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                    {diff.map((line, i) => (
                        <div key={i} className={`flex ${line.type === 'added' ? 'bg-green-900/30' : line.type === 'removed' ? 'bg-red-900/30' : ''}`}>
                             <div className={`w-8 text-right pr-3 select-none text-[10px] pt-0.5 ${line.type === 'added' ? 'text-green-500' : line.type === 'removed' ? 'text-red-500' : 'text-gray-600'}`}>
                                {i + 1}
                             </div>
                             <div className={`flex-1 pl-2 whitespace-pre-wrap break-all ${line.type === 'added' ? 'text-green-200' : line.type === 'removed' ? 'text-red-300 line-through opacity-60' : 'text-gray-400'}`}>
                                {line.type === 'added' && <span className="select-none mr-2 text-green-500">+</span>}
                                {line.type === 'removed' && <span className="select-none mr-2 text-red-500">-</span>}
                                {line.text}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};