'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, ArrowUp, ArrowDown, Trash2, Settings, Plus } from 'lucide-react';

export interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    // Adjust position if menu goes off screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 0) {
        x = 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }
      if (y < 0) {
        y = 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    // Don't close menu if item has submenu (user needs to click submenu item)
    if (!item.disabled && !item.submenu && item.onClick) {
      item.onClick();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="border-t border-gray-200 my-1" />;
        }

        if (!item.label || !item.onClick) {
          return null;
        }

        return (
          <div key={index} className="relative group">
            <button
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`
                w-full px-4 py-2 text-left text-sm flex items-center gap-3
                hover:bg-gray-100 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${item.disabled ? '' : 'cursor-pointer'}
                ${item.submenu ? 'pr-8' : ''}
              `}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.submenu && <span className="text-gray-400">›</span>}
            </button>
            {item.submenu && (
              <div className="ml-4 border-l border-gray-200 pl-1">
                {item.submenu.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!subItem.disabled && subItem.onClick) {
                        subItem.onClick();
                        onClose();
                      }
                    }}
                    disabled={subItem.disabled}
                    className={`
                      w-full px-4 py-2 text-left text-sm flex items-center gap-3
                      hover:bg-gray-100 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${subItem.disabled ? '' : 'cursor-pointer'}
                    `}
                  >
                    {subItem.icon && <span className="w-4 h-4 flex-shrink-0">{subItem.icon}</span>}
                    <span className="flex-1">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


