import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Grid, ChevronDown } from 'lucide-react';
import DynamicIcon from '../ui/DynamicIcon';

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelectIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get all valid icon names from Lucide
  const iconNames = Object.keys(LucideIcons).filter(
    key => typeof LucideIcons[key as keyof typeof LucideIcons] === 'function' && key !== 'default'
  );
  
  // Filter icons based on search term
  const filteredIcons = iconNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Icon
      </label>
        <div 
        className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:border-orange-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <DynamicIcon icon={selectedIcon} className="w-5 h-5" />
          <span>{selectedIcon}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg p-2">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search icons..."
              className="w-full p-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto" data-lenis-prevent>
            {filteredIcons.length > 0 ? (
              filteredIcons.map(name => (
                <div
                  key={name}
                  className={`p-2 flex flex-col items-center justify-center rounded cursor-pointer hover:bg-gray-100 text-xs ${
                    selectedIcon === name ? 'bg-orange-100 border border-orange-300' : ''
                  }`}
                  onClick={() => {
                    onSelectIcon(name);
                    setIsOpen(false);
                  }}                  title={name}
                >
                  <DynamicIcon icon={name} className="w-5 h-5 mb-1" />
                  <span className="truncate w-full text-center">{name}</span>
                </div>
              ))
            ) : (
              <div className="col-span-5 text-center py-4 text-gray-500">
                No icons found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSelector;
