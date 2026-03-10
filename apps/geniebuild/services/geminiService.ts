
import { GoogleGenAI, Type } from "@google/genai";
import { WebsiteData } from "../types";

export class GeminiService {
  /**
   * Modifies the website data based on user input.
   * Following the latest guidelines: instantiating GoogleGenAI inside the method 
   * to ensure the most up-to-date API key is used.
   */
  async modifyWebsite(currentData: WebsiteData, prompt: string): Promise<WebsiteData> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Recommended JSON response schema for robustness
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    try {
      // Accessing the .text property directly as per guidelines
      const text = response.text.trim();
      return JSON.parse(text) as WebsiteData;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("The AI provided an invalid website configuration. Please try again.");
    }
  }
}

export const geminiService = new GeminiService();
