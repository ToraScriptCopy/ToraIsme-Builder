import React, { useState, useRef, useEffect } from 'react';
import { UIElement, UIFolder, SliderElement, DropdownElement } from '../types';
import { ChevronDown, Check } from 'lucide-react';

interface ComponentProps {
  element: UIElement;
  isSelected: boolean;
  onClick: () => void;
  onLog: (msg: string) => void;
  onInteractiveUpdate?: (val: any) => void;
}

// --- Interactive Button ---
export const VisualButton: React.FC<ComponentProps> = ({ element, isSelected, onClick, onLog }) => (
  <div 
    onClick={(e) => { 
        e.stopPropagation(); 
        onClick(); 
        onLog(`[BUTTON] "${element.text}" fired callback.`);
        // Simulate execution
        if (element.customLogic) {
             onLog(`> Executing Logic...`);
        }
    }}
    className={`
      group relative w-full h-9 rounded bg-[#2a2a2a] border border-transparent
      hover:border-[#444] hover:bg-[#333] active:bg-[#444] transition-all cursor-pointer flex items-center justify-center
      ${isSelected ? 'ring-1 ring-[#007acc] border-[#007acc]' : 'mb-2'}
    `}
  >
    <span className="text-sm font-medium text-gray-200 select-none">{element.text}</span>
  </div>
);

// --- Interactive Toggle ---
export const VisualToggle: React.FC<ComponentProps> = ({ element, isSelected, onClick, onLog }) => {
  const [active, setActive] = useState(false);

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`
        w-full h-9 flex items-center justify-between px-3 rounded bg-transparent
        hover:bg-[#2a2a2a] transition-colors cursor-pointer mb-1
        ${isSelected ? 'bg-[#2a2a2a] ring-1 ring-[#007acc]' : ''}
      `}
    >
      <span className="text-sm text-gray-300 select-none">{element.text}</span>
      <div 
        onClick={(e) => { 
            e.stopPropagation(); 
            const newState = !active;
            setActive(newState); 
            onLog(`[TOGGLE] "${element.text}" set to ${newState}`);
            if(!isSelected) onClick();
        }}
        className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${active ? 'bg-[#007acc] border-[#007acc]' : 'border-[#444] bg-[#1a1a1a]'}`}
      >
        {active && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
      </div>
    </div>
  );
};

// --- Interactive Slider ---
export const VisualSlider: React.FC<ComponentProps> = ({ element, isSelected, onClick, onLog }) => {
  const sliderEl = element as SliderElement;
  const [localValue, setLocalValue] = useState(sliderEl.value);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync if external data changes
  useEffect(() => { setLocalValue(sliderEl.value) }, [sliderEl.value]);

  const handleInteract = (clientX: number) => {
     if (!trackRef.current) return;
     const rect = trackRef.current.getBoundingClientRect();
     let percent = (clientX - rect.left) / rect.width;
     percent = Math.max(0, Math.min(1, percent));
     
     const range = sliderEl.max - sliderEl.min;
     const newValue = Math.round((sliderEl.min + (range * percent)) * 10) / 10; // 1 decimal approx
     
     setLocalValue(newValue);
     return newValue;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
        if (isDragging) handleInteract(e.clientX);
    };
    const onUp = () => {
        if(isDragging) {
            setIsDragging(false);
            onLog(`[SLIDER] "${element.text}" set to ${localValue}`);
        }
    };
    
    if (isDragging) {
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }
    return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    }
  }, [isDragging, localValue, element.text, onLog]);

  if (element.type !== 'Slider') return null;
  
  const percentage = ((localValue - sliderEl.min) / (sliderEl.max - sliderEl.min)) * 100;

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`
        w-full py-2 px-3 rounded bg-transparent hover:bg-[#2a2a2a] cursor-pointer mb-1
        ${isSelected ? 'bg-[#2a2a2a] ring-1 ring-[#007acc]' : ''}
      `}
    >
      <div className="flex justify-between items-center mb-1 select-none">
        <span className="text-sm text-gray-300">{element.text}</span>
        <span className="text-xs text-gray-500 font-mono">{localValue}</span>
      </div>
      <div 
        ref={trackRef}
        onMouseDown={(e) => {
            setIsDragging(true);
            handleInteract(e.clientX);
        }}
        // Removed overflow-hidden to allow handle to overhang
        className="w-full h-1.5 bg-[#1a1a1a] rounded-full relative cursor-ew-resize group/track"
      >
        <div 
            style={{ width: `${percentage}%` }}
            className="absolute top-0 left-0 h-full bg-[#007acc] pointer-events-none relative rounded-l-full"
        >
             {/* Slider Handle - Always Visible now */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-transform hover:scale-125"></div>
        </div>
      </div>
    </div>
  );
};

// --- Interactive Dropdown ---
export const VisualDropdown: React.FC<ComponentProps> = ({ element, isSelected, onClick, onLog }) => {
  const ddElement = element as DropdownElement;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVal, setSelectedVal] = useState(ddElement.values[0] || "Select...");

  return (
    <div className="relative z-10">
        <div 
            onClick={(e) => { 
                e.stopPropagation(); 
                onClick(); 
                setIsOpen(!isOpen); 
            }}
            className={`
            w-full h-10 flex items-center justify-between px-3 rounded bg-[#2a2a2a]
            hover:bg-[#333] transition-colors cursor-pointer mb-2 relative
            ${isSelected ? 'ring-1 ring-[#007acc]' : ''}
            `}
        >
            <div className="flex flex-col justify-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider select-none">List</span>
                <span className="text-sm text-gray-200 select-none truncate max-w-[150px]">{element.text}: <span className="text-[#007acc]">{selectedVal}</span></span>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && (
            <div className="absolute top-11 left-0 w-full bg-[#333] border border-[#444] rounded shadow-xl z-50 flex flex-col overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar">
                {ddElement.values.length === 0 && <div className="p-2 text-xs text-gray-500 italic">No options</div>}
                {ddElement.values.map((val, idx) => (
                    <div 
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVal(val);
                            setIsOpen(false);
                            onLog(`[DROPDOWN] "${element.text}" selected "${val}"`);
                        }}
                        className="px-3 py-2 text-sm text-gray-200 hover:bg-[#007acc] cursor-pointer flex justify-between items-center"
                    >
                        {val}
                        {selectedVal === val && <Check size={12} />}
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

interface FolderProps {
  folder: UIFolder;
  isSelected: boolean;
  onSelectFolder: () => void;
  onSelectElement: (elId: string) => void;
  selectedElementId: string | null;
  onLog: (msg: string) => void;
}

export const VisualFolder: React.FC<FolderProps> = ({ 
  folder, 
  isSelected, 
  onSelectFolder, 
  onSelectElement, 
  selectedElementId,
  onLog
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Manage overflow state to allow dropdowns to pop out when expanded
  const [isOverflowHidden, setIsOverflowHidden] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
        setIsOverflowHidden(true);
    } else {
        // When expanding, keep overflow hidden during animation, then release
        setIsOverflowHidden(true);
        const timer = setTimeout(() => setIsOverflowHidden(false), 300);
        return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  return (
    <div className="mb-2 transition-all duration-300">
      {/* Folder Header */}
      <div 
        onClick={(e) => { e.stopPropagation(); onSelectFolder(); }}
        className={`
          flex items-center justify-between p-2 mb-1 cursor-pointer rounded transition-colors select-none
          ${isSelected ? 'bg-[#007acc]/10 text-[#007acc] border border-[#007acc]/50' : 'text-gray-400 hover:text-white border border-transparent'}
        `}
      >
        <div className="flex items-center gap-2">
           <span className="font-semibold tracking-wide uppercase text-xs">{folder.text}</span>
        </div>
        <div 
            onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
            className="p-1 hover:bg-white/10 rounded"
        >
             <ChevronDown size={14} className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
        </div>
      </div>

      {/* Folder Content */}
      <div className={`pl-2 border-l border-[#333] ml-2 space-y-1 transition-all duration-300 
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}
          ${isOverflowHidden ? 'overflow-hidden' : 'overflow-visible'}
      `}>
        {folder.elements.length === 0 && (
          <div className="text-xs text-gray-600 italic p-2 select-none">Empty folder</div>
        )}
        {folder.elements.map(el => {
          const props = {
            key: el.id,
            element: el,
            isSelected: el.id === selectedElementId,
            onClick: () => onSelectElement(el.id),
            onLog: onLog
          };
          
          if (el.type === 'Button') return <VisualButton {...props} />;
          if (el.type === 'Toggle') return <VisualToggle {...props} />;
          if (el.type === 'Slider') return <VisualSlider {...props} />;
          if (el.type === 'Dropdown') return <VisualDropdown {...props} />;
          return null;
        })}
      </div>
    </div>
  );
}