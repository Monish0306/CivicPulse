import {
  collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
  runTransaction, doc, getDoc, updateDoc, increment,
} from "firebase/firestore";
import { db } from "./firebase";

export interface FirestoreIssue {
  issueId?:      string;
  reportedBy:    string;
  reporterName:  string;
  category:      string;
  severity:      "low" | "medium" | "critical";
  dangerLevel:   number;
  department:    string;
  aiDescription: string;
  confidence:    number;
  butterflyEffect: string;
  imageUrl:      string;
  location: {
    lat:     number;
    lng:     number;
    address: string;
    zone:    string;
  };
  status:   "reported" | "verified" | "in_progress" | "resolved";
  upvotes:  number;
  createdAt?: unknown;
}


export async function createIssue(data: Omit<FirestoreIssue, "issueId">) {
  const ref = await addDoc(collection(db, "issues"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToIssues(cb: (issues: FirestoreIssue[]) => void) {
  const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({
      issueId: d.id,
      ...(d.data() as Omit<FirestoreIssue, "issueId">),
    })));
  });
}

// ── POSTS (Neighborhood Net) ──────────────────────────────
export interface Post {
  postId?:      string;
  authorUid:    string;
  authorName:   string;
  authorPhoto:  string;
  authorInitials: string;
  text:         string;
  imageUrl?:    string;
  likes:        string[];
  commentCount: number;
  createdAt?:   unknown;
}

export interface PostComment {
  commentId?:   string;
  authorUid:    string;
  authorName:   string;
  authorInitials: string;
  text:         string;
  createdAt?:   unknown;
}

export async function createPost(data: Omit<Post, "postId">) {
  // If imageUrl is base64, store it separately to avoid doc size limit
  let imageUrl = data.imageUrl || "";
  let imageDocId = "";

  if (imageUrl.startsWith("data:")) {
    // Store base64 image in separate collection
    const imgRef = await addDoc(collection(db, "images"), {
      data:      imageUrl,
      createdAt: serverTimestamp(),
    });
    imageDocId = imgRef.id;
    imageUrl   = `firestore:${imgRef.id}`; // reference marker
  }

  const ref = await addDoc(collection(db, "posts"), {
    ...data,
    imageUrl,
    imageDocId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPostImage(imageDocId: string): Promise<string> {
  const snap = await getDoc(doc(db, "images", imageDocId));
  return snap.exists() ? (snap.data().data as string) : "";
}

export function subscribeToPosts(cb: (posts: Post[]) => void) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ postId: d.id, ...(d.data() as Omit<Post, "postId">) })));
  });
}

export async function toggleLike(postId: string, userId: string) {
  const ref = doc(db, "posts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const likes: string[] = snap.data().likes || [];
    const already = likes.includes(userId);
    tx.update(ref, {
      likes: already ? likes.filter((id) => id !== userId) : [...likes, userId],
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeToComments(
  postId: string,
  cb: (comments: PostComment[]) => void
) {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ commentId: d.id, ...(d.data() as Omit<PostComment, "commentId">) })));
  });
}

export async function addPostComment(
  postId: string,
  comment: Omit<PostComment, "commentId">
) {
  await addDoc(collection(db, "posts", postId, "comments"), {
    ...comment,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), {
    commentCount: increment(1),
  });
}