import { onCall } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireField } from "./utils/validation.js";

export const extractDocument = onCall(async (request) => {
  const base64Image = requireField(request.data?.base64Image, "base64Image");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const imageData = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData,
      },
    },
    {
      text: "Extract the Kenyan document type, full name, and document number. Return strictly valid JSON with keys: name, type, documentNumber.",
    },
  ]);

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText.trim());

  return parsed;
});
