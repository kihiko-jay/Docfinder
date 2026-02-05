import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../config/firebase";

export const uploadDocumentImage = async (
  file: File,
  docId: string
): Promise<string> => {
  const storageRef = ref(storage, `documents/${docId}/image.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
