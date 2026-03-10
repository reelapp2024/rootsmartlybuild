import React from 'react';
import { Info } from 'lucide-react';

interface InfoButtonProps {
  onClick: (e: React.MouseEvent) => void;
  childrenCount?: number;
  className?: string;
}

export default function InfoButton({ onClick, childrenCount, className = '' }: InfoButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      className={`info-button ${className}`}
      style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        zIndex: 1000,
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        border: '1px solid rgba(59, 130, 246, 1)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 1)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title={childrenCount !== undefined && childrenCount > 0 
        ? `View layout (${childrenCount} children)` 
        : 'View element layout'}
    >
      <Info size={14} />
      {childrenCount !== undefined && childrenCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '1px solid white'
          }}
        >
          {childrenCount > 9 ? '9+' : childrenCount}
        </span>
      )}
    </button>
  );
}

