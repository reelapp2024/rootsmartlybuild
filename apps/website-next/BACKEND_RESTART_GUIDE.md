# Backend Server Restart Guide

## 🔄 Backend Restart करें

API में changes reflect करने के लिए backend server को restart करना जरूरी है।

### Steps:

1. **Backend Server Stop करें:**
   ```bash
   # Terminal में जहाँ backend चल रहा है
   # Ctrl + C दबाएं
   ```

2. **Backend Server Start करें:**
   ```bash
   cd aiwebbuilder/aibackend
   npm start
   ```

3. **API Verify करें:**
   - Browser में open करें: `http://localhost:1111/api/monorepo/hero`
   - Expected Response (NEW - Only Content, No Styles):
     ```json
     {
       "backgroundImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
       "title": "Best smm panel in the world!",
       "description": "Fully flexible smm panel, modular smm services, and ready for anything marketing and social growth. Drag, drop, customize!"
     }
     ```
     
     **Note:** Styles removed - Component uses fixed new design styles:
     - Section: `padding: "72px 40px"`, `minHeight: 420`
     - Overlay: `background: "rgba(255,255,255,0.9)"`, `padding: 28`, `borderRadius: "8px"`, `margin: "0 auto"`, `maxWidth: 600`
     - Title: `fontSize: "2.5rem"`, `fontWeight: 800`, `color: "#0f172a"`
     - Description: `fontSize: "1.125rem"`, `color: "#334155"`

4. **Browser Cache Clear करें:**
   - Hard Refresh: `Ctrl + Shift + R` (Windows) या `Cmd + Shift + R` (Mac)
   - या DevTools → Network tab → "Disable cache" enable करें

## ✅ Verification (NEW Format):

- ✅ Response में **NO styles object** होना चाहिए
- ✅ केवल content fields:
  - ✅ `backgroundImage`: URL string
  - ✅ `title`: String
  - ✅ `description`: String
- ✅ Component automatically नए design styles use करेगा (API styles ignore होते हैं)

## 🐛 अगर अभी भी Old Content दिख रहा है:

1. **Backend logs check करें:**
   - Terminal में errors check करें
   - Server properly start हुआ है या नहीं

2. **File save verify करें:**
   - `monorepoController.js` file save हुई है या नहीं
   - File में changes visible हैं या नहीं

3. **Port check करें:**
   - Backend port 1111 पर चल रहा है या नहीं
   - `http://localhost:1111` accessible है या नहीं

4. **Full restart:**
   ```bash
   # Stop backend (Ctrl+C)
   # Wait 2-3 seconds
   # Start again
   cd aiwebbuilder/aibackend
   npm start
   ```

