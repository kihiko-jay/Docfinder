import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { DocumentAlert, LostDocument } from "../../types";

const DOCUMENTS_COLLECTION = "documents";
const ALERTS_COLLECTION = "alerts";
const UNLOCKED_COLLECTION = "unlocked_contacts";

export const getDocuments = async (count = 50): Promise<LostDocument[]> => {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => item.data() as LostDocument);
};

export const onDocumentsSnapshot = (
  count: number,
  callback: (docs: LostDocument[]) => void
) => {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((item) => item.data() as LostDocument);
    callback(items);
  });
};

export const searchDocuments = async (
  queryText: string,
  type?: string
): Promise<LostDocument[]> => {
  const allDocs = await getDocuments(200);
  const trimmedQuery = queryText.trim().toLowerCase();
  const alphanumericQuery = trimmedQuery.replace(/[^a-z0-9]/g, "");

  return allDocs.filter((docItem) => {
    const nameMatch = docItem.name.toLowerCase().includes(trimmedQuery);
    const cleanDocNum = docItem.documentNumber
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const numMatch =
      alphanumericQuery !== "" && cleanDocNum.includes(alphanumericQuery);

    const matchesQuery = trimmedQuery === "" || nameMatch || numMatch;
    const matchesType = !type || type === "All" || docItem.type === type;

    return matchesQuery && matchesType;
  });
};

export const getAlerts = async (userId: string): Promise<DocumentAlert[]> => {
  const q = query(
    collection(db, ALERTS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => item.data() as DocumentAlert);
};

export const onAlertsSnapshot = (
  userId: string,
  callback: (alerts: DocumentAlert[]) => void
) => {
  const q = query(
    collection(db, ALERTS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((item) => item.data() as DocumentAlert);
    callback(items);
  });
};

export const checkUnlocked = async (
  userId: string,
  docId: string
): Promise<boolean> => {
  const q = query(
    collection(db, UNLOCKED_COLLECTION),
    where("userId", "==", userId),
    where("documentId", "==", docId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const getUnlockedDocs = async (userId: string): Promise<string[]> => {
  const q = query(
    collection(db, UNLOCKED_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => item.data().documentId as string);
};

// Writes are handled via Cloud Functions.
