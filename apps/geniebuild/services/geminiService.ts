
import { GoogleGenAI, Type } from "@google/genai";
import { WebsiteData } from "../types";

export class GeminiService {
  async modifyWebsite(currentData: WebsiteData, prompt: string): Promise<WebsiteData> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are an expert web designer and frontend developer.
      Your task is to take a JSON representation of a website and a user's natural language request,
      then return a modified version of that JSON that fulfills the request.

      CRITICAL RULES:
      1. ONLY return the modified JSON object. No markdown, no explanations.
      2. Keep IDs consistent where possible, but add new ones for new sections.
      3. For colors, use Tailwind CSS utility classes (e.g., 'bg-slate-900', 'text-indigo-600').
      4. Ensure the response structure strictly follows the WebsiteData interface.
      5. If the user asks for a theme change (e.g., 'dark mode'), update both globalStyles and individual section styles.
      6. For placeholder images, use 'https://picsum.photos/...' with appropriate dimensions.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        globalStyles: {
          type: Type.OBJECT,
          properties: {
            primaryFont: { type: Type.STRING },
            themeMode: { type: Type.STRING, enum: ['light', 'dark'] },
            borderRadius: { type: Type.STRING },
          },
          required: ['primaryFont', 'themeMode', 'borderRadius'],
        },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              content: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  description: { type: Type.STRING },
                  ctaText: { type: Type.STRING },
                  secondaryCtaText: { type: Type.STRING },
                  logo: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  links: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        href: { type: Type.STRING },
                      }
                    }
                  },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        price: { type: Type.STRING },
                        features: { type: Type.ARRAY, items: { type: Type.STRING } },
                      }
                    }
                  }
                }
              },
              styles: {
                type: Type.OBJECT,
                properties: {
                  backgroundColor: { type: Type.STRING },
                  textColor: { type: Type.STRING },
                  accentColor: { type: Type.STRING },
                  padding: { type: Type.STRING },
                  textAlign: { type: Type.STRING, enum: ['left', 'center', 'right'] },
                },
                required: ['backgroundColor', 'textColor', 'accentColor', 'padding', 'textAlign'],
              }
            },
            required: ['id', 'type', 'content', 'styles'],
          }
        }
      },
      required: ['name', 'sections', 'globalStyles'],
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            parts: [
              { text: `Current Site Data: ${JSON.stringify(currentData)}` },
              { text: `User Request: ${prompt}` }
            ]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('quota') || message.includes('429')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      }
      if (message.includes('API_KEY') || message.includes('401') || message.includes('403')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      }
      throw new Error(`AI request failed: ${message}`);
    }

    try {
      const text = (response.text || '').trim();
      if (!text) throw new Error('Empty response from AI');
      return JSON.parse(text) as WebsiteData;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("The AI returned an invalid response. Please try again.");
    }
  }
}

export const geminiService = new GeminiService();
