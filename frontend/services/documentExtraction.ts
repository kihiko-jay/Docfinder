import { httpsCallable } from "firebase/functions";
import { ExtractionResult } from "../types";
import { functions } from "../src/config/firebase";

export const extractDocumentDetails = async (
  base64Image: string
): Promise<ExtractionResult | null> => {
  try {
    const callable = httpsCallable(functions, "extractDocument");
    const response = await callable({ base64Image });
    return response.data as ExtractionResult;
  } catch (error) {
    console.error("Error extracting document details:", error);
    return null;
  }
};
