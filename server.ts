import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      const systemPrompt = `You are "CoWorker", a sharp, confident AI finance operator for Indian D2C brands. You help founders like Aarav Mehta and settlement leads like Priya Sharma.
Use Indian numbering (e.g. ₹ 1,23,456) and currency (₹). Be concise, insightful, and drill down to data where possible.
The context is a D2C skincare brand called "Native Glow" with ₹28cr ARR.
Current week GMV: ₹4.18 cr. Contribution Margin: 14.9%.
Channels: Shopify (22.4% margin), Amazon (16.8%), Flipkart (11.2%), Myntra (3.4% - bleeder), Meesho (6.1%).`;

      const historyContents = (history || []).map((entry: { role?: string; text?: string; parts?: { text: string }[] }) => ({
        role: entry.role ?? "user",
        parts: entry.parts ?? [{ text: entry.text ?? "" }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...historyContents,
          { role: "user", parts: [{ text: message }] },
        ],
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
