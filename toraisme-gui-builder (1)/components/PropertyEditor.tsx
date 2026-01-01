import React from 'react';
import { Trash2, Settings2, Info, Code } from 'lucide-react';

interface Props {
  selectedType: 'window' | 'folder' | 'element' | null;
  data: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export const PropertyEditor: React.FC<Props> = ({ selectedType, data, onUpdate, onDelete }) => {
  if (!selectedType || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6e7681] text-sm select-none">
        <Settings2 size={48} className="mb-4 opacity-20" />
        <p>No element selected.</p>
        <p className="text-xs mt-2 opacity-60">Select an item from the Preview to edit.</p>
      </div>
    );
  }

  const InputField = ({ label, value, field, type = "text", placeholder = "", desc = "" }: any) => (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-xs font-medium text-[#cccccc] flex justify-between">
        {label}
        {type === 'number' && <span className="text-[10px] text-[#007acc] font-mono">number</span>}
        {type === 'text' && <span className="text-[10px] text-[#ce9178] font-mono">string</span>}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => {
            const val = type === 'number' ? parseFloat(e.target.value) : e.target.value;
            onUpdate({ [field]: val });
        }}
        placeholder={placeholder}
        className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] text-white text-sm px-2 py-1 outline-none rounded-sm font-mono placeholder-white/20"
      />
      {desc && <p className="text-[10px] text-[#858585] leading-tight">{desc}</p>}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Header */}
      <div className="h-9 min-h-[36px] bg-[#252526] border-b border-[#333] flex items-center justify-between px-4">
        <span className="text-xs font-bold text-[#cccccc] uppercase tracking-wide">
          {selectedType === 'window' ? 'Window Config' : data.type ? `${data.type} Properties` : 'Folder Config'}
        </span>
        {selectedType !== 'window' && (
            <button 
                onClick={onDelete} 
                className="text-[#cccccc] hover:text-white hover:bg-[#b93636] p-1 rounded transition-colors"
                title="Delete Element"
            >
                <Trash2 size={14} />
            </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        
        {/* Title / Text */}
        <InputField 
            label={selectedType === 'window' ? 'Window Title' : 'Display Text'}
            value={selectedType === 'window' ? data.title : data.text}
            field={selectedType === 'window' ? 'title' : 'text'}
            desc="The visual text displayed on the UI."
        />

        {/* Element Specifics */}
        {selectedType === 'element' && (
            <>
                {['Toggle', 'Slider', 'Dropdown'].includes(data.type) && (
                    <InputField 
                        label="Flag (Unique ID)" 
                        value={data.flag || ''} 
                        field="flag" 
                        desc="Used to save/load configuration. Must be unique."
                    />
                )}

                {data.type === 'Slider' && (
                    <div className="p-2 bg-[#1e1e1e] border border-[#333] rounded mb-4">
                        <span className="text-[10px] font-bold text-[#007acc] uppercase mb-2 block">Slider Config</span>
                        <div className="grid grid-cols-2 gap-2">
                             <InputField label="Min" value={data.min} field="min" type="number" />
                             <InputField label="Max" value={data.max} field="max" type="number" />
                             <InputField label="Default" value={data.value} field="value" type="number" />
                             <InputField label="Decimals" value={data.decimals} field="decimals" type="number" />
                        </div>
                    </div>
                )}

                {data.type === 'Dropdown' && (
                     <div className="flex flex-col gap-1 mb-4">
                        <label className="text-xs font-medium text-[#cccccc]">Options</label>
                        <textarea 
                            rows={6}
                            value={data.values.join(', ')} 
                            onChange={(e) => onUpdate({ values: e.target.value.split(',').map((s: string) => s.trim()) })}
                            className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] text-white text-xs px-2 py-2 outline-none rounded-sm font-mono resize-none"
                            placeholder="Option 1, Option 2, ..."
                        />
                        <p className="text-[10px] text-[#858585]">Comma separated list of values.</p>
                     </div>
                )}

                {/* LOGIC EDITOR */}
                <div className="flex flex-col gap-1 mb-4">
                    <label className="text-xs font-medium text-[#cccccc] flex items-center gap-1">
                        <Code size={12} className="text-green-500" />
                        Callback Logic (Lua)
                    </label>
                    <textarea 
                        rows={8}
                        value={data.customLogic || ''} 
                        onChange={(e) => onUpdate({ customLogic: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] text-[#d4d4d4] text-xs px-2 py-2 outline-none rounded-sm font-mono resize-none leading-relaxed"
                        placeholder="print('Clicked!')"
                        spellCheck={false}
                    />
                    <p className="text-[10px] text-[#858585]">Code inside the callback function. <br/>Use this to persist logic.</p>
                </div>
            </>
        )}

        <div className="mt-8 p-3 bg-[#1e1e1e] border-l-2 border-[#007acc]">
            <div className="flex items-center gap-2 mb-1">
                <Info size={14} className="text-[#007acc]" />
                <span className="text-xs font-bold text-white">Pro Tip</span>
            </div>
            <p className="text-[10px] text-[#999]">
                Use the "Callback Logic" box above to write script. Logic written there is saved with the element!
            </p>
        </div>
      </div>
    </div>
  );
};