import { signInAnonymously } from "firebase/auth";
import { auth } from "../config/firebase";

export const ensureAnonymousAuth = async (): Promise<string> => {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  const result = await signInAnonymously(auth);
  return result.user.uid;
};
