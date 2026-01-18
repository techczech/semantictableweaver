import { GoogleGenAI } from "@google/genai";
import { SemanticData } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const processTableInput = async (
  content: string,
  inputType: 'text' | 'image',
  mimeType?: string
): Promise<SemanticData> => {
  const ai = getAiClient();
  
  // Using Gemini 2.5 Flash for speed and multimodal capabilities
  const modelId = 'gemini-2.5-flash';

  const prompt = `
    You are a semantic data conversion engine (TabWeaver). 
    Your goal is to take the provided input (which represents a table in CSV, Markdown, or an Image) and convert it into a structured, semantic JSON object.
    
    Rules:
    1. Parse the data accurately. If it's an image, perform OCR and layout analysis to extract the table.
    2. Generate column definitions. For each column, provide:
       - 'key': A cleaner camelCase or snake_case key for JSON properties (e.g., "annualRevenue").
       - 'label': A Human Readable string for display in the UI (e.g., "Annual Revenue").
    3. Detect data types:
       - Convert strings to numbers where appropriate (e.g., "$1,000.00" -> 1000.00).
       - IMPORTANT: If a cell contains a list (bullet points, numbered lists, or multiple distinct items separated by newlines), convert it into a JSON Array of strings. 
         Example: "• Read start to finish\n• Never skip" should become ["Read start to finish", "Never skip"].
    4. Generate a concise but insightful summary of what this table represents.
    5. Suggest a short title for the dataset.

    Return ONLY a raw JSON object (no markdown code fences) with this specific structure:
    {
      "suggestedTitle": "Short Title Here",
      "summary": "A 2-3 sentence description of the data trends or contents.",
      "columns": [
        { "key": "col1Key", "label": "Column 1 Label" },
        { "key": "col2Key", "label": "Column 2 Label" }
      ],
      "data": [
        { "col1Key": "value", "col2Key": ["Item 1", "Item 2"], ... },
        ...
      ]
    }
  `;

  let contents;

  if (inputType === 'image' && mimeType) {
    // For images, we send the base64 data
    const cleanBase64 = content.includes('base64,') ? content.split('base64,')[1] : content;
    
    contents = {
      parts: [
        {
          text: prompt
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        }
      ]
    };
  } else {
    // For text (CSV/Markdown)
    contents = {
      parts: [
        {
          text: prompt + `\n\nInput Data:\n${content}`
        }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    
    // Validation to ensure structure matches new type definition
    const columns = parsed.columns || [];
    const dataRows = parsed.data || [];
    
    // Fallback if columns are missing but data exists
    if (columns.length === 0 && dataRows.length > 0) {
        Object.keys(dataRows[0]).forEach(key => {
            columns.push({ 
                key, 
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) // Basic title case conversion
            });
        });
    }

    return {
      summary: parsed.summary || "No summary provided.",
      suggestedTitle: parsed.suggestedTitle || "Untitled Dataset",
      data: dataRows,
      columns: columns
    };

  } catch (error) {
    console.error("Gemini Processing Error:", error);
    throw new Error("Failed to process the table data. Please ensure the input is clear and try again.");
  }
};