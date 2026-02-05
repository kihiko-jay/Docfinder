import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
import { DocumentAlert, Feedback, LostDocument } from "../../types";

export const createDocument = async (payload: LostDocument) => {
  const callable = httpsCallable(functions, "createDocument");
  const response = await callable(payload);
  return response.data as { id: string };
};

export const createAlert = async (payload: DocumentAlert) => {
  const callable = httpsCallable(functions, "createAlert");
  const response = await callable(payload);
  return response.data as { id: string };
};

export const createFeedback = async (payload: Feedback) => {
  const callable = httpsCallable(functions, "createFeedback");
  await callable(payload);
};

export const getContact = async (documentId: string) => {
  const callable = httpsCallable(functions, "getContact");
  const response = await callable({ documentId });
  return response.data as { finderPhone: string };
};
