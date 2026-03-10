import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { templates } from "./templates";

function TemplateItem({ type }: { type: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `tpl_${type}`, data: { type } });
  
  const getTemplateDescription = (type: string) => {
    if (type === 'DummyTemplate') return 'Test template with heading, text & button';
    if (type === 'HeroSection') return 'Hero section with customizable elements';
    if (type === 'HeroWithBackground') return 'Hero section with background (deprecated)';
    return 'Template';
  };
  
  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      style={{ 
        padding: '12px', 
        border: "1px solid #e5e7eb", 
        borderRadius: 8, 
        cursor: "grab", 
        background: "#fff",
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
          {type}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {getTemplateDescription(type)}
        </div>
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af' }}>⋮⋮</div>
    </div>
  );
}

export default function Palette() {
  // Get all available templates dynamically
  const templateKeys = Object.keys(templates || {});
  
  // Filter out HeroWithBackground and only show HeroSection and other templates
  const availableTemplates = templateKeys.filter(key => {
    // Remove HeroWithBackground if HeroSection exists
    if (key === 'HeroWithBackground' && templateKeys.includes('HeroSection')) {
      return false;
    }
    // Show HeroSection, DummyTemplate, and other templates
    return key === 'HeroSection' || key === 'DummyTemplate' || 
           (key !== 'HeroWithBackground' && templates[key]?.type !== 'HeroWithBackground');
  });
  
  // Ensure HeroSection is always available
  const finalTemplates = availableTemplates.length > 0 
    ? availableTemplates 
    : ['HeroSection', 'DummyTemplate'];
  
  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Templates</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {finalTemplates.map((type) => (
          <TemplateItem key={type} type={type} />
        ))}
      </div>
    </div>
  );
}
