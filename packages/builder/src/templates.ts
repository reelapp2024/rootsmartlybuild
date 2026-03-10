import type { Node } from "@schema/core";
import { templates as discoveredTemplates } from "@ui/blocks";

// Type for discovered templates from @ui/blocks
type ComponentTemplate = {
  id: string;
  type: string;
  props: Record<string, any>;
};

// Convert ComponentTemplate to Node format
function templateToNode(templateKey: string, template: ComponentTemplate): Node {
  return {
    id: template.id || `tmp_${templateKey}`,
    type: template.type || templateKey,
    props: template.props || {},
    style: {}
  };
}

// Convert discovered templates to Node format
const convertedTemplates: Record<string, Node> = {};
if (discoveredTemplates) {
  Object.keys(discoveredTemplates).forEach((key) => {
    // Skip HeroWithBackground if HeroSection exists
    if (key === 'HeroWithBackground' && discoveredTemplates['HeroSection']) {
      return;
    }
    const template = (discoveredTemplates as Record<string, ComponentTemplate>)[key];
    if (template) {
      convertedTemplates[key] = templateToNode(key, template);
    }
  });
  // Templates discovered and converted
}

// Dummy template for testing with Section, Row, Column structure
// This template represents a complete section with nested row/column layout
const dummyTemplate: Node = {
  id: 'dummy_template',
  type: 'HeroWithBackground',
  props: {
    title: 'Section: Main Section',
    description: 'This is a Section containing Rows and Columns. Row 1 has 2 Columns. Row 2 has 1 Column.',
    backgroundImage: ''
  },
  style: {
    padding: '40px 20px',
    background: '#f0f9ff',
    borderRadius: '12px',
    border: '2px solid #3b82f6',
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }
};

// Content Section template
const contentSectionTemplate: Node = {
  id: 'content_section_template',
  type: 'ContentSection',
  props: {
    title: 'Our Amazing Features',
    description: 'Discover the power of our innovative platform. Build beautiful websites with ease, customize every detail, and bring your vision to life.',
    backgroundColor: '#ffffff'
  },
  style: {
    padding: '80px 40px',
    background: '#ffffff',
    borderRadius: '0px'
  }
};

// Merge discovered templates with dummy template and content section
export const templates: Record<string, Node> = {
  ...convertedTemplates,
  DummyTemplate: dummyTemplate,
  ContentSection: contentSectionTemplate
};

// Templates ready for use

export function cloneTemplate(key: keyof typeof templates): Node {
  const base = templates[key];
  
  // Special handling for DummyTemplate to create section/row/column structure
  if (key === 'DummyTemplate') {
    const sectionId = `section_${Math.random().toString(36).slice(2, 8)}`;
    const row1Id = `row_${Math.random().toString(36).slice(2, 8)}`;
    const row2Id = `row_${Math.random().toString(36).slice(2, 8)}`;
    const col1Id = `col_${Math.random().toString(36).slice(2, 8)}`;
    const col2Id = `col_${Math.random().toString(36).slice(2, 8)}`;
    const col3Id = `col_${Math.random().toString(36).slice(2, 8)}`;
    
    // Return the section node (parent)
    return {
      id: sectionId,
      type: 'HeroWithBackground',
      props: {
        title: 'Section: Main Section',
        description: 'This is a Section containing Rows and Columns',
        backgroundImage: ''
      },
      style: {
        padding: '40px 20px',
        background: '#f0f9ff',
        borderRadius: '12px',
        border: '2px solid #3b82f6',
        minHeight: '500px'
      },
      children: [
        {
          id: row1Id,
          type: 'HeroWithBackground',
          props: {
            title: 'Row 1',
            description: 'Row 1 contains 2 columns',
            backgroundImage: ''
          },
          style: {
            padding: '20px',
            background: '#ffffff',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '16px',
            flexDirection: 'row'
          },
          children: [
            {
              id: col1Id,
              type: 'HeroWithBackground',
              props: {
                title: 'Column 1',
                description: 'Content in Column 1',
                backgroundImage: ''
              },
              style: {
                padding: '16px',
                background: '#eff6ff',
                borderRadius: '4px',
                flex: 1,
                border: '1px dashed #3b82f6'
              }
            },
            {
              id: col2Id,
              type: 'HeroWithBackground',
              props: {
                title: 'Column 2',
                description: 'Content in Column 2',
                backgroundImage: ''
              },
              style: {
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '4px',
                flex: 1,
                border: '1px dashed #10b981'
              }
            }
          ]
        },
        {
          id: row2Id,
          type: 'HeroWithBackground',
          props: {
            title: 'Row 2',
            description: 'Row 2 contains 1 column',
            backgroundImage: ''
          },
          style: {
            padding: '20px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '16px',
            flexDirection: 'row'
          },
          children: [
            {
              id: col3Id,
              type: 'HeroWithBackground',
              props: {
                title: 'Column 3',
                description: 'Full width column in Row 2',
                backgroundImage: ''
              },
              style: {
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '4px',
                flex: 1,
                border: '1px dashed #f59e0b'
              }
            }
          ]
        }
      ]
    };
  }
  
  // Default cloning for other templates
  return JSON.parse(JSON.stringify({ ...base, id: `${(base as any).type}_${Math.random().toString(36).slice(2, 8)}` }));
}
