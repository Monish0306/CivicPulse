import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadIssueImage(file: File, issueId: string) {
  const storageRef = ref(storage, `issues/${issueId}/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}