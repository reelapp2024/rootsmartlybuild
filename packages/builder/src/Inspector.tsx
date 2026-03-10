import React, { useState } from "react";
import { useStudio } from "./store";
import { useTheme, type ThemeName, type FontName } from "@ui/blocks";

export default function Inspector({ onHide }: { onHide?: () => void }) {
  const {
    nodes,
    selectedId,
    selectedEl,
    updateSelectedProps,
    updateNodeStyle,
    updateElementStyle,
    updateElementProps,
    setTheme,
    theme,
    setFont,
    font,
    removeNode
  } = useStudio() as any;
  const { setTheme: setGlobalTheme, setFont: setGlobalFont } = useTheme();
  const sel = nodes.find((n: any) => n.id === selectedId);
  const [tab, setTab] = useState<'layout'|'style'|'advanced'>('layout');

  const handleThemeChange = (newTheme: ThemeName) => { setTheme(newTheme); setGlobalTheme(newTheme); };
  const handleFontChange = (newFont: FontName) => { setFont(newFont); setGlobalFont(newFont); };

  // Element-level inspector if an inner element is selected
  if (sel && selectedEl) {
    const { elId, elType } = selectedEl;
    const onStyleNumEl = (key: keyof React.CSSProperties) => (e: React.ChangeEvent<HTMLInputElement>) => updateElementStyle(sel.id, elId, { [key]: e.target.value === '' ? undefined : Number(e.target.value) });
    const onStyleStrEl = (key: keyof React.CSSProperties) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => updateElementStyle(sel.id, elId, { [key]: e.target.value });

    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3>Inspector (Element)</h3>
          {onHide && (<button onClick={onHide} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>Hide</button>)}
        </div>
        <div style={{ color: "#475569", marginBottom: 8 }}>Type: {elType} • ID: {elId}</div>

        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button onClick={()=>setTab('layout')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='layout'? '#eef2ff':'#fff' }}>Layout</button>
          <button onClick={()=>setTab('style')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='style'? '#eef2ff':'#fff' }}>Style</button>
          <button onClick={()=>setTab('advanced')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='advanced'? '#eef2ff':'#fff' }}>Advanced</button>
        </div>

        {tab==='layout' && (
          <div>
            {elType === 'div' && (
              <>
                <label>Display</label>
                <select onChange={onStyleStrEl('display')} style={{ width:'100%', marginBottom:8 }}>
                  <option value="">(inherit)</option>
                  <option value="block">block</option>
                  <option value="flex">flex</option>
                  <option value="grid">grid</option>
                </select>
                <label>Flex Direction</label>
                <select onChange={onStyleStrEl('flexDirection')} style={{ width:'100%', marginBottom:8 }}>
                  <option value="">(inherit)</option>
                  <option value="row">row</option>
                  <option value="column">column</option>
                </select>
                <label>Justify Content</label>
                <select onChange={onStyleStrEl('justifyContent')} style={{ width:'100%', marginBottom:8 }}>
                  <option value="">(inherit)</option>
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                  <option value="space-between">space-between</option>
                  <option value="space-around">space-around</option>
                  <option value="space-evenly">space-evenly</option>
                </select>
                <label>Align Items</label>
                <select onChange={onStyleStrEl('alignItems')} style={{ width:'100%', marginBottom:8 }}>
                  <option value="">(inherit)</option>
                  <option value="stretch">stretch</option>
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                </select>
              </>
            )}
            {(elType === 'text' || elType === 'heading') && (
              <>
                <label>Text Align</label>
                <select onChange={onStyleStrEl('textAlign')} style={{ width:'100%', marginBottom:8 }}>
                  <option value="">(inherit)</option>
                  <option value="left">left</option>
                  <option value="center">center</option>
                  <option value="right">right</option>
                </select>
              </>
            )}
          </div>
        )}

        {tab==='style' && (
          <div>
            {(elType === 'text' || elType === 'heading') && (
              <>
                <label>Text</label>
                <input onChange={(e)=>updateElementProps(sel.id, elId, { text: e.target.value })} style={{ width:'100%', marginBottom:8 }} placeholder="Enter text" />
                <label>Color</label>
                <input onChange={onStyleStrEl('color')} style={{ width:'100%', marginBottom:8 }} />
                <label>Font Size (px)</label>
                <input type="number" onChange={onStyleNumEl('fontSize')} style={{ width:'100%', marginBottom:8 }} />
                <label>Font Weight</label>
                <input onChange={onStyleStrEl('fontWeight' as any)} style={{ width:'100%', marginBottom:8 }} />
              </>
            )}

            {elType === 'div' && (
              <>
                <label>Background</label>
                <input onChange={onStyleStrEl('background')} style={{ width:'100%', marginBottom:8 }} placeholder="#fff, url(...), gradient" />
                <label>Border</label>
                <input onChange={onStyleStrEl('border')} style={{ width:'100%', marginBottom:8 }} placeholder="1px solid #e5e7eb" />
              </>
            )}
          </div>
        )}

        {tab==='advanced' && (
          <div>
            <label>Padding (px)</label>
            <input type="number" onChange={onStyleNumEl('padding')} style={{ width:'100%', marginBottom:8 }} />
            <label>Margin (px)</label>
            <input type="number" onChange={onStyleNumEl('margin')} style={{ width:'100%', marginBottom:8 }} />
            <label>Gap (px)</label>
            <input type="number" onChange={onStyleNumEl('gap')} style={{ width:'100%', marginBottom:8 }} />
          </div>
        )}
      </div>
    );
  }

  // Node-level inspector (existing)
  if (!sel) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Inspector</h3>
        {onHide && (
          <button onClick={onHide} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>Hide</button>
        )}
      </div>
      <div style={{ color: "#64748b", marginBottom: 16 }}>Select a block to edit props.</div>

      <h4>Theme</h4>
      <select value={theme} onChange={(e) => { const v = e.target.value as ThemeName; setTheme(v); setGlobalTheme(v); }} style={{ width: "100%", marginBottom: 8 }}>
        <option value="crimson-jet">Crimson Jet</option>
        <option value="indigo-sand">Indigo Sand</option>
        <option value="citrus-navy">Citrus Navy</option>
      </select>

      <h4>Font Family</h4>
      <select value={font} onChange={(e) => { const v = e.target.value as FontName; setFont(v); setGlobalFont(v); }} style={{ width: "100%", marginBottom: 8 }}>
        <option value="inter">Inter</option>
        <option value="roboto">Roboto</option>
        <option value="open-sans">Open Sans</option>
        <option value="poppins">Poppins</option>
        <option value="lato">Lato</option>
        <option value="montserrat">Montserrat</option>
      </select>
    </div>
  );

  // Node-level tabs (as before)
  const onStyleNum = (key: keyof React.CSSProperties) => (e: React.ChangeEvent<HTMLInputElement>) => updateNodeStyle(sel.id, { [key]: e.target.value === '' ? undefined : Number(e.target.value) });
  const onStyleStr = (key: keyof React.CSSProperties) => (e: React.ChangeEvent<HTMLInputElement>) => updateNodeStyle(sel.id, { [key]: e.target.value });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Inspector</h3>
        {onHide && (<button onClick={onHide} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>Hide</button>)}
      </div>
      <div style={{ color: "#475569", marginBottom: 8 }}>Type: {sel.type}</div>

      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={()=>setTab('layout')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='layout'? '#eef2ff':'#fff' }}>Layout</button>
        <button onClick={()=>setTab('style')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='style'? '#eef2ff':'#fff' }}>Style</button>
        <button onClick={()=>setTab('advanced')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='advanced'? '#eef2ff':'#fff' }}>Advanced</button>
      </div>

      {tab==='layout' && (
        <div>
          <label>Display</label>
          <select value={sel.style?.display ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { display: e.target.value })} style={{ width:'100%', marginBottom:8 }}>
            <option value="">(inherit)</option>
            <option value="block">block</option>
            <option value="flex">flex</option>
            <option value="grid">grid</option>
          </select>
          <label>Min/Max (px)</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <input type="number" placeholder="minWidth" value={sel.style?.minWidth ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { minWidth: Number(e.target.value||0) })} />
            <input type="number" placeholder="minHeight" value={sel.style?.minHeight ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { minHeight: Number(e.target.value||0) })} />
            <input type="number" placeholder="maxWidth" value={sel.style?.maxWidth ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { maxWidth: Number(e.target.value||0) })} />
            <input type="number" placeholder="maxHeight" value={sel.style?.maxHeight ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { maxHeight: Number(e.target.value||0) })} />
          </div>
        </div>
      )}

      {tab==='style' && (
        <div>
          <label>Background</label>
          <input value={sel.style?.background ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { background: e.target.value })} style={{ width:'100%', marginBottom:8 }} placeholder="#ffffff, url(...), gradients" />
          <label>Border</label>
          <input value={sel.style?.border ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { border: e.target.value })} style={{ width:'100%', marginBottom:8 }} placeholder="1px solid #e5e7eb" />
          <label>Border Radius (px)</label>
          <input type="number" value={sel.style?.borderRadius ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { borderRadius: Number(e.target.value||0) })} style={{ width:'100%', marginBottom:8 }} />
        </div>
      )}

      {tab==='advanced' && (
        <div>
          <label>Padding (px)</label>
          <input type="number" value={sel.style?.padding ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { padding: Number(e.target.value||0) })} style={{ width:'100%', marginBottom:8 }} />
          <label>Margin (px)</label>
          <input type="number" value={sel.style?.margin ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { margin: Number(e.target.value||0) })} style={{ width:'100%', marginBottom:8 }} />
          <label>Gap (px)</label>
          <input type="number" value={sel.style?.gap ?? ''} onChange={(e)=>updateNodeStyle(sel.id, { gap: Number(e.target.value||0) })} style={{ width:'100%', marginBottom:8 }} />
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={() => removeNode(sel.id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Delete</button>
      </div>
    </div>
  );
}
