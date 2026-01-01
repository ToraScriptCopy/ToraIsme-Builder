export type ElementType = 'Button' | 'Toggle' | 'Slider' | 'Dropdown';

export interface BaseElement {
  id: string;
  type: ElementType;
  text: string;
  customLogic?: string; // New field for user scripts
}

export interface ButtonElement extends BaseElement {
  type: 'Button';
}

export interface ToggleElement extends BaseElement {
  type: 'Toggle';
  flag: string;
  defaultState: boolean;
}

export interface SliderElement extends BaseElement {
  type: 'Slider';
  min: number;
  max: number;
  value: number;
  decimals: number;
  flag: string;
}

export interface DropdownElement extends BaseElement {
  type: 'Dropdown';
  values: string[];
  flag: string;
}

export type UIElement = ButtonElement | ToggleElement | SliderElement | DropdownElement;

export interface UIFolder {
  id: string;
  text: string;
  elements: UIElement[];
}

export interface UIWindow {
  title: string;
  folders: UIFolder[];
}

export interface SavedScript {
  id: string;
  name: string;
  timestamp: number;
  data: UIWindow;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface LogEntry {
  type: 'info' | 'error' | 'warn' | 'success';
  message: string;
  timestamp: string;
}

export interface EditorFile {
  id: string;
  name: string;
  data: UIWindow;
  language: 'lua';
}