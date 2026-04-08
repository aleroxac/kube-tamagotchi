
import { GoogleGenAI } from "@google/genai";
import { ClusterMetrics, PetType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export interface PetGallery {
  healthy: string | null;
  sick: string | null;
  sad: string | null;
  hungry: string | null;
  fat: string | null;
  dead: string | null;
}

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPetComment = async (metrics: ClusterMetrics, petName: string, petType: PetType): Promise<string> => {
  const prompt = `
    You are ${petName}, a digital ${petType} whose life is tied to a Kubernetes cluster. 
    Metrics: Health ${metrics.health.toFixed(0)}%, Mood ${metrics.mood.toFixed(0)}%, Hunger ${metrics.hunger.toFixed(0)}%, Weight ${metrics.weight.toFixed(0)}%.
    
    Provide a short, witty, one-sentence comment about your current state. 
    Reference Kubernetes concepts (pods, nodes, HPA, OOMKill, context switch) mixed with natural ${petType} behaviors.
    Keep it technical but cute. Do not use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Synchronizing with master node...";
  } catch (error) {
    return "Control plane is unresponsive...";
  }
};

const fetchSingleStateWithRetry = async (petType: PetType, stateDescription: string, retries = 4): Promise<string | null> => {
  const prompt = `Hyper-realistic high-detail 32-bit pixel art of a natural ${petType}. 
    The animal is ${stateDescription}. 
    Style: Professional pixel art masterpiece, high-fidelity textures, soft natural lighting. 
    NO robots, NO cybernetics, NO machines. Just a realistic animal in a pixelated style. 
    Aspect ratio 1:1.`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Use a fresh instance for each call to ensure the latest API key/context
      const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isRateLimit && attempt < retries - 1) {
        // Aggressive backoff for image generation: 10s, 20s, 30s
        const waitTime = (attempt + 1) * 10000;
        console.warn(`Quota exceeded for ${stateDescription}. Attempt ${attempt + 1}/${retries}. Waiting ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      console.error(`Failed to generate ${stateDescription} state:`, error);
      return null;
    }
  }
  return null;
};

export const generatePetGallery = async (petType: PetType, onProgress?: (msg: string) => void): Promise<PetGallery> => {
  const states = [
    { key: 'healthy', desc: "perfectly healthy, vibrant, and happy in a sunny meadow" },
    { key: 'sick', desc: "sick and weak, with a bandaged paw and sad eyes, shivering in a rainy gloomy background" },
    { key: 'sad', desc: "extremely tired and exhausted, panting, lying down on the ground with droopy eyes" },
    { key: 'hungry', desc: "starving and feral, with glowing demonic eyes and a predatory hungry look in a dark misty forest" },
    { key: 'fat', desc: "comically fat and heavy, looking overfed and slow, resting in a field of flowers" },
    { key: 'dead', desc: "resting peacefully forever as a ghostly ethereal spirit, monochrome style, garden background" }
  ];

  const gallery: Partial<PetGallery> = {};

  // Sequential processing with significant gaps (8s) between states to stay under RPM limits
  for (const state of states) {
    if (onProgress) onProgress(`OS: Rendering state [${state.key.toUpperCase()}]...`);
    
    const result = await fetchSingleStateWithRetry(petType, state.desc);
    gallery[state.key as keyof PetGallery] = result;
    
    // Give the API time to breathe after a successful (or failed) generation
    if (onProgress) onProgress(`OS: Cooling down circuits for state synchronization...`);
    await delay(8000); 
  }

  return gallery as PetGallery;
};
