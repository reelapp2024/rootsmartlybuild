import React from "react";
import { registry, ThemeProvider } from "@ui/blocks";
import type { PageDoc, Node } from "@schema/core";

function renderNode(node: Node): React.ReactNode {
  // Handle native HTML elements
  if (['div', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'img'].includes(node.type)) {
    const Tag = node.type as keyof JSX.IntrinsicElements;
    const nodeStyle = node.style || node.props?.style;
    const nodeProps = { ...(node.props || {}) };
    // Remove style from props if it's in node.style
    if (node.style) {
      delete nodeProps.style;
    }
    const textContent = nodeProps.text;
    delete nodeProps.text; // Remove text from props
    
    return (
      <Tag key={node.id} {...nodeProps} style={nodeStyle}>
        {textContent || null}
        {node.children?.map(renderNode)}
      </Tag>
    );
  }
  
  // Handle registered components
  const Cmp = (registry as any)[node.type];
  if (!Cmp) return null;
  return <Cmp key={node.id} {...(node.props || {})} style={node.style || node.props?.style}>
    {node.children?.map(renderNode)}
  </Cmp>;
}

const doc: PageDoc ={
  "_version": 1,
  "id": "draft",
  "slug": "draft",
  "title": "Draft",
  "root": {
    "id": "root",
    "type": "Page",
    "children": [
      {
        "id": "HeroWithBackground_deem0b",
        "type": "HeroWithBackground",
        "props": {
          "backgroundImage": "",
          "title": "Welcome to the Future Builder!",
          "description": "Describe your amazing product here."
        }
      },
      {
        "id": "ContentSection_001",
        "type": "div",
        "props": {
          "style": {
            "padding": "80px 40px",
            "backgroundColor": "#ffffff",
            "maxWidth": "1200px",
            "margin": "0 auto"
          }
        },
        "children": [
          {
            "id": "ContentHeading_001",
            "type": "h2",
            "props": {
              "style": {
                "fontSize": "2.5rem",
                "fontWeight": "700",
                "color": "#1e293b",
                "textAlign": "center",
                "marginBottom": "24px"
              }
            },
            "children": [
              {
                "id": "text_001",
                "type": "span",
                "props": {
                  "text": "Our Amazing Features"
                }
              }
            ]
          },
          {
            "id": "ContentText_001",
            "type": "p",
            "props": {
              "style": {
                "fontSize": "1.125rem",
                "color": "#64748b",
                "textAlign": "center",
                "lineHeight": "1.8",
                "maxWidth": "800px",
                "margin": "0 auto"
              }
            },
            "children": [
              {
                "id": "text_002",
                "type": "span",
                "props": {
                  "text": "Discover the power of our innovative platform. Build beautiful websites with ease, customize every detail, and bring your vision to life."
                }
              }
            ]
          }
        ]
      }
    ]
  }
}

export default function App(){
  return (
    <ThemeProvider initialTheme="crimson-jet" initialFont="inter">
      <div>
        {doc.root.children?.map(renderNode)}
      </div>
    </ThemeProvider>
  );
}
