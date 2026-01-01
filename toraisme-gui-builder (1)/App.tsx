import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  MousePointer2, 
  PlusSquare, 
  ToggleLeft, 
  List, 
  SlidersHorizontal,
  Code2,
  Copy,
  CheckCircle2,
  Menu,
  Play,
  Save,
  Sparkles,
  FileText,
  Download,
  X,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

import { UIWindow, UIFolder, UIElement, ElementType, SavedScript, LogEntry, EditorFile } from './types';
import { generateLuaCode } from './services/luaGenerator';
import { VisualFolder } from './components/VisualComponents';
import { PropertyEditor } from './components/PropertyEditor';
import { AIChat } from './components/AIChat';
import { SidebarMenu } from './components/SidebarMenu';
import { Console } from './components/Console';
import { ContextMenu } from './components/ContextMenu';
import { HistoryModal } from './components/HistoryModal';

// Initial Helper
const generateId = () => Math.random().toString(36).substr(2, 9);

const initialData: UIWindow = {
  title: "Tora GUI",
  folders: [
    {
      id: 'f-1',
      text: 'Main Tab',
      elements: []
    }
  ]
};

const App: React.FC = () => {
  // --- File System State ---
  const [historyStack, setHistoryStack] = useState<EditorFile[][]>([[{ id: '1', name: 'script.lua', data: initialData, language: 'lua' }]]);
  const [historyPointer, setHistoryPointer] = useState(0);

  // Derived current state
  const files = historyStack[historyPointer];
  const [activeFileId, setActiveFileId] = useState<string>('1');

  // Derived Active File
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const windowData = activeFile.data;

  // --- Selection State ---
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // --- UI State ---
  const [luaCode, setLuaCode] = useState<string>('');
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<SavedScript[]>([]);
  const [isWindowCollapsed, setIsWindowCollapsed] = useState(false);
  const [isWindowOverflowHidden, setIsWindowOverflowHidden] = useState(false);
  
  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTargetFileId, setHistoryTargetFileId] = useState<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'global' | 'tab', targetId?: string } | null>(null);

  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('tora_history');
    if (saved) {
        try { setHistory(JSON.parse(saved)); } catch (e) { }
    }
    
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Overflow logic for Main Window (to allow dropdowns)
  useEffect(() => {
    if (isWindowCollapsed) {
        setIsWindowOverflowHidden(true);
    } else {
        setIsWindowOverflowHidden(true);
        const timer = setTimeout(() => setIsWindowOverflowHidden(false), 300);
        return () => clearTimeout(timer);
    }
  }, [isWindowCollapsed]);


  // Sync Code for Active File (Auto Generation)
  useEffect(() => {
    const code = generateLuaCode(windowData);
    setLuaCode(code);
    setIsManualEdit(false); 
  }, [windowData]); 

  // --- Helpers ---
  
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
      setLogs(prev => [...prev, {
          type,
          message,
          timestamp: new Date().toLocaleTimeString().split(' ')[0]
      }]);
      if (type === 'error') setIsConsoleOpen(true);
  };

  // --- Undo / Redo Logic ---
  const pushToHistory = (newFiles: EditorFile[]) => {
      const newStack = historyStack.slice(0, historyPointer + 1);
      newStack.push(newFiles);
      if (newStack.length > 50) newStack.shift(); 
      else setHistoryPointer(historyPointer + 1);
      
      setHistoryStack(newStack.length > 50 ? newStack : newStack);
      if (newStack.length <= 50) setHistoryPointer(newStack.length - 1);
  };

  const handleUndo = () => {
      if (historyPointer > 0) {
          setHistoryPointer(historyPointer - 1);
          addLog('Undo successful', 'info');
      }
  };

  const handleRedo = () => {
      if (historyPointer < historyStack.length - 1) {
          setHistoryPointer(historyPointer + 1);
          addLog('Redo successful', 'info');
      }
  };

  const handleRestoreVersion = (restoredFile: EditorFile) => {
      const newFiles = files.map(f => f.id === restoredFile.id ? restoredFile : f);
      pushToHistory(newFiles);
      addLog(`Restored version of ${restoredFile.name}`, 'success');
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              handleUndo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              handleRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyPointer, historyStack]);

  // --- State Modifiers ---

  const updateActiveFile = (newData: Partial<UIWindow>) => {
    const newFiles = files.map(f => 
      f.id === activeFileId ? { ...f, data: { ...f.data, ...newData } } : f
    );
    pushToHistory(newFiles);
  };

  const updateSpecificFile = (fileId: string, newData: UIWindow) => {
      const newFiles = files.map(f => f.id === fileId ? { ...f, data: newData } : f);
      pushToHistory(newFiles);
  };

  const updateActiveFileName = (newName: string) => {
    const newFiles = files.map(f => 
      f.id === activeFileId ? { ...f, name: newName } : f
    );
    pushToHistory(newFiles);
  };

  const createNewFile = () => {
      const newId = generateId();
      const newFile: EditorFile = {
          id: newId,
          name: 'untitled.lua',
          data: {
              title: "New Script",
              folders: [{ id: generateId(), text: 'Main Tab', elements: [] }]
          },
          language: 'lua'
      };
      pushToHistory([...files, newFile]);
      setActiveFileId(newId);
      setSelectedFolderId(newFile.data.folders[0].id);
      setSelectedElementId(null);
      addLog('Opened new tab.', 'info');
  };

  const closeFile = (fileId: string) => {
      if (files.length === 1) {
          addLog('Cannot close the last tab.', 'warn');
          return;
      }
      const newFiles = files.filter(f => f.id !== fileId);
      pushToHistory(newFiles);
      
      if (activeFileId === fileId) {
          const nextFile = newFiles[newFiles.length - 1];
          setActiveFileId(nextFile.id);
          setSelectedElementId(null);
          setSelectedFolderId(nextFile.data.folders[0]?.id || '');
      }
  };

  // --- Context Menu Handlers ---
  
  const handleGlobalContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'global' });
  };

  const handleTabContextMenu = (e: React.MouseEvent, fileId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'tab', targetId: fileId });
  };

  const renameTab = (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      if(!file) {
          addLog("File not found for renaming", 'error');
          return;
      }
      const newName = prompt("Rename file:", file.name);
      if(newName && newName.trim() !== "") {
          const newFiles = files.map(f => f.id === fileId ? { ...f, name: newName } : f);
          pushToHistory(newFiles);
          addLog(`Renamed to ${newName}`, 'success');
      }
  };

  const openHistory = (fileId: string) => {
      setHistoryTargetFileId(fileId);
      setHistoryModalOpen(true);
  };

  // --- Action Handlers ---

  const saveToHistory = () => {
    const newSave: SavedScript = {
        id: generateId(),
        name: activeFile.name,
        timestamp: Date.now(),
        data: windowData
    };
    const newHistory = [newSave, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('tora_history', JSON.stringify(newHistory));
    addLog(`Saved "${activeFile.name}" to local history.`, 'success');
  };

  const loadFromHistory = (data: UIWindow) => {
    const newId = generateId();
    const newFile: EditorFile = {
        id: newId,
        name: data.title + '.lua',
        data: data,
        language: 'lua'
    };
    pushToHistory([...files, newFile]);
    setActiveFileId(newId);
    setSelectedElementId(null);
    if (data.folders.length > 0) setSelectedFolderId(data.folders[0].id);
    addLog('Loaded script into new tab.', 'info');
  };

  const handleDownload = (ext: 'lua' | 'txt') => {
      const element = document.createElement("a");
      const file = new Blob([luaCode], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      let downloadName = activeFile.name;
      if (!downloadName.endsWith('.' + ext)) {
          downloadName = downloadName.split('.')[0] + '.' + ext;
      }
      element.download = downloadName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      addLog(`Downloaded ${downloadName}`, 'success');
  };

  const handleRunScript = () => {
      setIsConsoleOpen(true);
      addLog(`Running analysis for ${activeFile.name}...`, 'info');
      
      const flags = new Set<string>();
      let errors = 0;
      let criticalErrors = 0;
      
      windowData.folders.forEach(f => {
          f.elements.forEach(el => {
              if ('flag' in el && el.flag) {
                  if (flags.has(el.flag)) {
                      addLog(`Duplicate flag detected: "${el.flag}" in element "${el.text}"`, 'error');
                      criticalErrors++;
                  } else {
                      flags.add(el.flag);
                  }
              }
              if (!el.text || el.text.trim() === '') {
                  addLog(`Critical: Element inside "${f.text}" has no display text.`, 'error');
                  criticalErrors++;
              }
              if (el.customLogic) {
                  const openP = (el.customLogic.match(/\(/g) || []).length;
                  const closeP = (el.customLogic.match(/\)/g) || []).length;
                  if (openP !== closeP) {
                      addLog(`Syntax Error: Mismatched parentheses in "${el.text}" logic.`, 'error');
                      criticalErrors++;
                  }
              }
          });
      });

      if (criticalErrors > 0) {
          addLog(`Analysis Failed: ${criticalErrors} Critical Errors Found.`, 'error');
      } else if (errors > 0) {
          addLog(`Analysis Completed with ${errors} Warnings.`, 'warn');
      } else {
          addLog('Syntax Check Passed: Script looks good!', 'success');
      }
  };

  // --- Element Modification Logic ---

  const addFolder = () => {
    const newFolder: UIFolder = {
      id: generateId(),
      text: "New Tab",
      elements: []
    };
    updateActiveFile({ folders: [...windowData.folders, newFolder] });
    setSelectedFolderId(newFolder.id);
  };

  const addElement = (type: ElementType) => {
    if (!selectedFolderId) {
        addLog('Select a folder first.', 'warn');
        return;
    }

    let newElement: UIElement;
    const baseId = generateId();

    switch (type) {
      case 'Button':
        newElement = { id: baseId, text: `Button`, type: 'Button' };
        break;
      case 'Toggle':
        newElement = { id: baseId, text: `Toggle`, type: 'Toggle', flag: `toggle_${Date.now()}`, defaultState: false };
        break;
      case 'Slider':
        newElement = { id: baseId, text: `Slider`, type: 'Slider', min: 0, max: 100, value: 50, decimals: 0, flag: `slider_${Date.now()}` };
        break;
      case 'Dropdown':
        newElement = { id: baseId, text: `Dropdown`, type: 'Dropdown', values: ['Option 1', 'Option 2'], flag: `dropdown_${Date.now()}` };
        break;
      default: return;
    }

    const newFolders = windowData.folders.map(f => {
        if (f.id === selectedFolderId) {
          return { ...f, elements: [...f.elements, newElement] };
        }
        return f;
    });
    
    updateActiveFile({ folders: newFolders });
    setSelectedElementId(newElement.id);
  };

  const handleDelete = () => {
    if (selectedElementId) {
      const newFolders = windowData.folders.map(f => ({
          ...f,
          elements: f.elements.filter(e => e.id !== selectedElementId)
      }));
      updateActiveFile({ folders: newFolders });
      setSelectedElementId(null);
    } else if (selectedFolderId) {
       if(windowData.folders.length <= 1) return;
       const newFolders = windowData.folders.filter(f => f.id !== selectedFolderId);
       updateActiveFile({ folders: newFolders });
       setSelectedFolderId(newFolders[0].id);
    }
  };

  const handleUpdate = (updates: any) => {
    if (selectedElementId) {
      const newFolders = windowData.folders.map(f => ({
          ...f,
          elements: f.elements.map(e => e.id === selectedElementId ? { ...e, ...updates } : e)
      }));
      updateActiveFile({ folders: newFolders });
    } else if (selectedFolderId && !selectedElementId) {
       const newFolders = windowData.folders.map(f => f.id === selectedFolderId ? { ...f, ...updates } : f);
       updateActiveFile({ folders: newFolders });
    } else {
      updateActiveFile(updates);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(luaCode);
    setCopied(true);
    addLog('Source code copied to clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine selection for Property Editor
  let selectedData = null;
  let selectedType: 'window' | 'folder' | 'element' | null = null;

  if (selectedElementId) {
    selectedType = 'element';
    for (const f of windowData.folders) {
      const el = f.elements.find(e => e.id === selectedElementId);
      if (el) selectedData = el;
    }
  } else if (selectedFolderId) {
    selectedType = 'folder';
    selectedData = windowData.folders.find(f => f.id === selectedFolderId);
  } else {
    selectedType = 'window';
    selectedData = windowData;
  }

  // --- Define historyFile here before return ---
  const historyFile = historyTargetFileId ? (files.find(f => f.id === historyTargetFileId) || activeFile) : activeFile;

  return (
    <div 
        className="flex flex-col h-screen w-full bg-[#1e1e1e] overflow-hidden text-[#cccccc] font-sans"
        onContextMenu={handleGlobalContextMenu}
    >
      
      {/* --- TOP BAR --- */}
      <div className="h-10 bg-[#1e1e1e] flex items-center justify-between px-3 border-b border-[#2b2b2b] select-none z-30 relative">
         <div className="flex items-center gap-4">
             {/* Logo */}
             <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-[#007acc] flex items-center justify-center rounded-sm">
                    <Code2 size={16} className="text-white" />
                 </div>
                 <span className="font-bold text-sm tracking-tight text-white hidden md:block">ToraIsme Builder</span>
             </div>
             
             {/* Menu */}
             <div className="flex items-center gap-1 text-xs text-[#cccccc] relative" ref={fileMenuRef}>
                <div 
                    className={`px-2 py-1 rounded hover:bg-[#333] hover:text-white cursor-pointer transition-colors ${isFileMenuOpen ? 'bg-[#333] text-white' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setIsFileMenuOpen(!isFileMenuOpen); }}
                >
                    File
                </div>
                
                {isFileMenuOpen && (
                    <div className="absolute top-8 left-0 w-48 bg-[#252526] border border-[#333] shadow-xl rounded-sm py-1 flex flex-col z-50">
                        <button onClick={() => { createNewFile(); setIsFileMenuOpen(false); }} className="text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2">
                            <FileText size={14} /> New File (New Tab)
                        </button>
                        <div className="h-px bg-[#333] my-1"></div>
                        <button onClick={() => { handleDownload('lua'); setIsFileMenuOpen(false); }} className="text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2">
                            <Download size={14} /> Download .lua
                        </button>
                    </div>
                )}
                <span onClick={handleRunScript} className="px-2 py-1 hover:bg-[#333] hover:text-white cursor-pointer transition-colors text-green-400">Run</span>
             </div>
         </div>
         
         {/* Filename Editor (Center) */}
         <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block group">
             <input 
                type="text" 
                value={activeFile.name}
                onChange={(e) => updateActiveFileName(e.target.value)}
                className="bg-transparent text-xs text-center text-[#999] group-hover:text-white focus:text-white outline-none border border-transparent focus:border-[#333] rounded px-2 py-0.5 transition-all w-48"
             />
         </div>

         {/* Right Actions */}
         <div className="flex items-center gap-2">
             <button onClick={handleRunScript} className="p-1.5 hover:bg-[#333] rounded text-green-500" title="Run Check">
                <Play size={16} />
             </button>
             <button 
                onClick={saveToHistory}
                className="p-1.5 hover:bg-[#333] rounded text-[#cccccc]"
                title="Save to History"
             >
                <Save size={16} />
             </button>
             {/* AI Button with Label */}
             <button 
                onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                className={`h-7 px-2 rounded flex items-center gap-2 transition-colors border border-transparent ${isAiChatOpen ? 'bg-[#333] text-white border-[#007acc]/30' : 'text-[#cccccc] hover:bg-[#333]'}`}
                title="AI Assistant"
             >
                <Sparkles size={14} className={isAiChatOpen ? "text-[#007acc]" : ""} />
                <span className="text-xs font-semibold tracking-wide">AI Codex</span>
             </button>
             <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-1.5 hover:bg-[#333] rounded text-[#cccccc]"
             >
                <Menu size={18} />
             </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- LEFT PANEL: Tabs & Code Editor --- */}
        <div className="w-1/2 flex flex-col border-r border-[#2b2b2b]">
            
            {/* Tabs Container */}
            <div className="flex h-9 bg-[#1e1e1e] border-b border-[#2b2b2b] overflow-x-auto no-scrollbar">
                {files.map(file => (
                    <div 
                        key={file.id}
                        onContextMenu={(e) => handleTabContextMenu(e, file.id)}
                        onClick={() => {
                            setActiveFileId(file.id);
                            if(file.data.folders.length > 0) setSelectedFolderId(file.data.folders[0].id);
                            setSelectedElementId(null);
                        }}
                        className={`
                            group flex items-center gap-2 px-3 border-r border-[#2b2b2b] text-xs cursor-pointer min-w-[120px] max-w-[160px] relative
                            ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]' : 'bg-[#252526] text-[#999] border-t-2 border-t-transparent hover:bg-[#2a2a2d]'}
                        `}
                    >
                        <span className={`text-[10px] ${activeFileId === file.id ? 'text-[#e6c07b]' : 'opacity-50'}`}>LUA</span>
                        <span className="truncate flex-1">{file.name}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
                            className={`opacity-0 group-hover:opacity-100 hover:bg-[#444] rounded p-0.5 ${files.length === 1 ? 'hidden' : ''}`}
                        >
                            <X size={10} />
                        </button>
                    </div>
                ))}
                
                {/* New Tab Button */}
                <button 
                    onClick={createNewFile}
                    className="px-2 hover:bg-[#333] text-[#666] hover:text-white transition-colors"
                    title="New Tab"
                >
                    <PlusSquare size={14} />
                </button>
            </div>
            
            <div className="flex-1 relative bg-[#1e1e1e]">
                <Editor
                    height="100%"
                    defaultLanguage="lua"
                    value={luaCode}
                    theme="vs-dark"
                    options={{
                        readOnly: false,
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 22,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        renderLineHighlight: 'line',
                        contextmenu: false,
                    }}
                    onChange={(val) => {
                        setLuaCode(val || '');
                        setIsManualEdit(true);
                    }}
                />
                
                <button 
                    onClick={handleCopy}
                    className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1.5 text-xs bg-[#007acc] hover:bg-[#0063a5] text-white rounded shadow-lg transition-colors z-10 font-bold"
                >
                    {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    {copied ? 'COPIED' : 'COPY'}
                </button>
            </div>
        </div>

        {/* --- RIGHT PANEL: Visual Builder --- */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
            
            <div className="h-11 bg-[#252526] border-b border-[#2b2b2b] flex items-center justify-between px-4">
                <span className="text-[11px] font-bold text-[#6e7681] uppercase tracking-wider">VISUAL PREVIEW</span>
                
                <div className="flex items-center h-full">
                    <button 
                        onClick={addFolder} 
                        className="h-full px-2 text-[#cccccc] hover:text-white hover:bg-[#333] transition-colors flex items-center" 
                        title="Add Folder"
                    >
                        <PlusSquare size={18} strokeWidth={1.5} />
                    </button>
                    
                    <div className="w-px h-5 bg-[#444] mx-2"></div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => addElement('Button')} disabled={!selectedFolderId} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#333] text-[#cccccc] disabled:opacity-30 bg-[#2a2a2a]/50 text-[10px] font-medium transition-colors">
                            <MousePointer2 size={14} /> Button
                        </button>
                        <button onClick={() => addElement('Toggle')} disabled={!selectedFolderId} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#333] text-[#cccccc] disabled:opacity-30 bg-[#2a2a2a]/50 text-[10px] font-medium transition-colors">
                            <ToggleLeft size={14} /> Toggle
                        </button>
                        <button onClick={() => addElement('Slider')} disabled={!selectedFolderId} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#333] text-[#cccccc] disabled:opacity-30 bg-[#2a2a2a]/50 text-[10px] font-medium transition-colors">
                            <SlidersHorizontal size={14} /> Slider
                        </button>
                        <button onClick={() => addElement('Dropdown')} disabled={!selectedFolderId} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#333] text-[#cccccc] disabled:opacity-30 bg-[#2a2a2a]/50 text-[10px] font-medium transition-colors">
                            <List size={14} /> List
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <div 
                    className="flex-1 bg-[#1e1e1e] p-8 overflow-y-auto flex justify-center items-start relative bg-grid"
                    onClick={() => { setSelectedElementId(null); setSelectedFolderId(''); }}
                >
                    <div className="absolute bottom-2 right-4 text-[10px] text-[#444] select-none pointer-events-none">
                        ToraIsme Builder &copy; 2026 • Privacy Protected
                    </div>

                    <div 
                        className={`w-[380px] bg-[#222] rounded-lg shadow-2xl border border-[#333] flex flex-col relative transition-all duration-300 ${isWindowCollapsed ? 'h-auto' : 'min-h-[450px]'}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedElementId(null); setSelectedFolderId(''); }}
                    >
                        {/* Main Window Header */}
                        <div 
                            className={`h-11 bg-[#2b2b2b] rounded-t-lg border-b border-[#333] flex items-center px-4 cursor-pointer justify-between
                            ${!selectedElementId && !selectedFolderId ? 'ring-1 ring-[#007acc]' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedElementId(null); setSelectedFolderId(''); }}
                        >
                            <div className="flex items-center gap-2">
                                <div onClick={(e) => { e.stopPropagation(); setIsWindowCollapsed(!isWindowCollapsed); }} className="hover:bg-white/10 p-1 rounded">
                                     <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isWindowCollapsed ? '-rotate-90' : ''}`} />
                                </div>
                                <span className="font-bold text-gray-200 text-sm truncate">{windowData.title}</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#333]"></div>
                            </div>
                        </div>

                        {/* Collapsible Content with Overflow Logic */}
                        <div className={`p-4 flex-1 space-y-2 transition-all duration-300 
                            ${isWindowCollapsed ? 'max-h-0 opacity-0 p-0' : 'max-h-[2000px] opacity-100'}
                            ${isWindowOverflowHidden ? 'overflow-hidden' : 'overflow-visible'}
                        `}>
                             {windowData.folders.map(folder => (
                                <VisualFolder 
                                    key={folder.id} 
                                    folder={folder} 
                                    isSelected={selectedFolderId === folder.id}
                                    onSelectFolder={() => setSelectedFolderId(folder.id)}
                                    onSelectElement={setSelectedElementId}
                                    selectedElementId={selectedElementId}
                                    onLog={(msg) => addLog(msg, 'info')}
                                />
                             ))}
                        </div>
                    </div>
                </div>

                <div className="w-64 border-l border-[#2b2b2b] bg-[#252526]">
                    <PropertyEditor 
                        selectedType={selectedType} 
                        data={selectedData} 
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                </div>

                <Console 
                    isOpen={isConsoleOpen}
                    onClose={() => setIsConsoleOpen(false)}
                    logs={logs}
                    onClear={() => setLogs([])}
                />
            </div>
        </div>
      </div>

      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-white text-[11px] select-none z-50">
        <div className="flex items-center gap-3">
            <span className="font-bold">READY</span>
            <span>Lua</span>
            <span>UTF-8</span>
            {isManualEdit && (
                <span className="flex items-center gap-1 text-yellow-300 font-bold bg-yellow-900/40 px-1.5 rounded">
                    <AlertTriangle size={10} /> MANUAL EDIT
                </span>
            )}
        </div>
        <div className="flex items-center gap-3">
            <span>{files.length} Open Tabs</span>
            <span>Console: {isConsoleOpen ? 'Open' : 'Closed'}</span>
        </div>
      </div>

      <AIChat 
        files={files}
        activeFileId={activeFileId}
        isOpen={isAiChatOpen} 
        onClose={() => setIsAiChatOpen(false)}
        onApplyCode={(fileId, newData) => {
            updateSpecificFile(fileId, newData);
            if(fileId === activeFileId) {
                setSelectedElementId(null);
                if (newData.folders.length > 0) setSelectedFolderId(newData.folders[0].id);
            }
        }}
      />
      
      <SidebarMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        history={history}
        onLoadScript={loadFromHistory}
      />

      {contextMenu && (
        <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            type={contextMenu.type}
            onClose={() => setContextMenu(null)}
            actions={{
                onRename: () => {
                    const id = contextMenu.targetId;
                    if(id) {
                        setTimeout(() => renameTab(id), 10);
                    }
                },
                onCloseTab: () => closeFile(contextMenu.targetId!),
                onHistory: () => openHistory(contextMenu.targetId!),
                onUndo: handleUndo,
                onRedo: handleRedo,
                onCopy: handleCopy
            }}
        />
      )}

      {/* History Modal */}
      <HistoryModal 
         isOpen={historyModalOpen}
         onClose={() => setHistoryModalOpen(false)}
         currentFile={historyFile}
         historyStack={historyStack}
         onRestore={handleRestoreVersion}
      />

      <style>{`
        .bg-grid {
            background-image: radial-gradient(#333 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1e1e1e; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #444; 
            border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555; 
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .shadow-up {
            box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  );
};

export default App;