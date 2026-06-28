import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Image as ImageIcon, Heart, MessageCircle,
  Share2, CheckCircle2, Users, UserPlus,
  Send, X, ChevronDown, ChevronUp, MapPin,
} from "lucide-react";
import { getDoc, doc } from "firebase/firestore";
import {
  createPost, subscribeToPosts, toggleLike,
  subscribeToComments, addPostComment,
  type Post, type PostComment,
} from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { uploadIssueImage } from "@/lib/storage";
export async function getPostImage(imageDocId: string): Promise<string> {
  const snap = await getDoc(doc(db, "images", imageDocId));
  return snap.exists() ? (snap.data().data as string) : "";
}

// ── helpers ───────────────────────────────────────────────
function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(ts: unknown): string {
  if (!ts) return "just now";
  try {
    const date = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return "just now"; }
}

// ── User hook ─────────────────────────────────────────────
function useCurrentUser() {
  const [user, setUser] = useState<{
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      import("@/lib/firebase").then(({ auth }) => {
        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u ? {
            uid: u.uid,
            displayName: u.displayName,
            photoURL: u.photoURL,
            email: u.email,
          } : null);
        });
      });
    });
    return () => unsub?.();
  }, []);

  return user;
}

// ── Root ──────────────────────────────────────────────────
export function NeighborhoodNet() {
  const [posts, setPosts] = useState<Post[]>([]);
  const user = useCurrentUser();

  useEffect(() => {
    const unsub = subscribeToPosts(setPosts);
    return unsub;
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Neighborhood Net
        </h1>
        <p className="mt-2 text-slate-500">
          A trusted feed for civic action, neighbor introductions, and resolved wins.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <CreatePostBox user={user} />

          {posts.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-sm">
              <div className="text-4xl mb-3">🏘️</div>
              <p className="text-slate-500 text-sm">
                No posts yet. Be the first to share a civic update!
              </p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.postId} post={post} currentUser={user} />
          ))}
        </div>

        <aside className="space-y-6">
          <BuildNetworkCard />
          <InfluenceCard postsCount={posts.filter(p => p.authorUid === user?.uid).length} />
        </aside>
      </div>
    </div>
  );
}

// ── Create Post ───────────────────────────────────────────
function CreatePostBox({ user }: {
  user: { uid: string; displayName: string | null; photoURL: string | null; email: string | null } | null
}) {
  const [text,         setText]         = useState("");
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting,      setPosting]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(user?.displayName);

  const onFile = (f: File | null) => {
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!text.trim() && !imageFile) {
      toast.error("Write something or add a photo first");
      return;
    }
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }
    setPosting(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadIssueImage(imageFile, `post_${Date.now()}`);
      }
      await createPost({
        authorUid:      user.uid,
        authorName:     user.displayName || user.email?.split("@")[0] || "Anonymous",
        authorPhoto:    user.photoURL || "",
        authorInitials: initials,
        text:           text.trim(),
        imageUrl,
        likes:          [],
        commentCount:   0,
      });
      toast.success("Post published!", { description: "+5 Civic Points awarded." });
      setText("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Post error:", err);
      toast.error("Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm text-center">
        <p className="text-slate-500 text-sm">
          <a href="/login" className="text-blue-600 font-semibold">Sign in</a> to post updates
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex gap-3">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer"
            className="h-11 w-11 rounded-full object-cover shrink-0" />
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-600 text-white text-sm font-bold">
            {initials}
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="What civic action did you take today?"
          className="flex-1 resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-fuchsia-200"
        />
      </div>

      {imagePreview && (
        <div className="mt-3 ml-14 relative">
          <img src={imagePreview} alt="Preview"
            className="h-48 w-full rounded-2xl object-cover ring-1 ring-slate-200" />
          <button
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)} />

      <div className="mt-4 flex items-center justify-between pl-14">
        <button
          onClick={() => fileRef.current?.click()}
          className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-fuchsia-600 transition"
          title="Add photo"
        >
          <ImageIcon className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={handlePost}
          disabled={posting}
          className="rounded-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-700 px-5 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg transition disabled:opacity-60"
        >
          {posting ? "Posting…" : "Post Update"}
        </button>
      </div>
    </div>
  );
}
function PostImage({ imageUrl, imageDocId }: { imageUrl: string; imageDocId?: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!imageUrl) return;

    if (imageUrl.startsWith("firestore:") && imageDocId) {
      // Fetch base64 from images collection
      import("@/lib/firestore").then(({ getPostImage }) => {
        getPostImage(imageDocId).then(setSrc);
      });
    } else if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
      setSrc(imageUrl);
    }
  }, [imageUrl, imageDocId]);

  if (!src) return (
    <div className="mt-4 h-48 w-full rounded-2xl bg-slate-100 animate-pulse" />
  );

  return (
    <img
      src={src}
      alt="Post"
      className="mt-4 w-full rounded-2xl object-cover max-h-80 ring-1 ring-slate-200"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// ── Post Card ─────────────────────────────────────────────
function PostCard({ post, currentUser }: {
  post: Post;
  currentUser: {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    email: string | null;
  } | null;
}) {
  const liked = currentUser ? post.likes.includes(currentUser.uid) : false;
  const [showComments, setShowComments] = useState(false);
  const [showShare,    setShowShare]    = useState(false);

  const handleLike = async () => {
    if (!currentUser) { toast.error("Sign in to like posts"); return; }
    try {
      await toggleLike(post.postId!, currentUser.uid);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      {/* Author */}
      <div className="flex items-center gap-3">
        {post.authorPhoto ? (
          <img src={post.authorPhoto} alt="" referrerPolicy="no-referrer"
            className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-sm font-bold">
            {post.authorInitials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">{post.authorName}</span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Civic Update
            </span>
          </div>
          <div className="text-xs text-slate-500">{timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {/* Text */}
      {post.text && (
        <p className="mt-3 text-slate-700 leading-relaxed text-sm">{post.text}</p>
      )}

      {/* Image */}
      {post.imageUrl && <PostImage imageUrl={post.imageUrl} imageDocId={(post as any).imageDocId} />}

      {/* Stats */}
      {(post.likes.length > 0 || post.commentCount > 0) && (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 border-b border-slate-100 pb-2">
          {post.likes.length > 0 && (
            <span>❤️ {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}</span>
          )}
          {post.commentCount > 0 && (
            <span>💬 {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}</span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
        <button
          onClick={handleLike}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 transition ${
            liked ? "text-rose-600 bg-rose-50" : "hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-rose-600" : ""}`} />
          {liked ? "Liked" : "Like"}
        </button>
        <button
          onClick={() => { setShowComments((s) => !s); setShowShare(false); }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-blue-50 hover:text-blue-600 transition"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
          {showComments
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />}
        </button>
        <button
          onClick={() => { setShowShare((s) => !s); setShowComments(false); }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>

      {showComments && <CommentPanel postId={post.postId!} currentUser={currentUser} />}
      {showShare    && <SharePanel post={post} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ── Comments ──────────────────────────────────────────────
function CommentPanel({ postId, currentUser }: {
  postId: string;
  currentUser: { uid: string; displayName: string | null; photoURL: string | null } | null;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [text,     setText]     = useState("");
  const [posting,  setPosting]  = useState(false);

  useEffect(() => {
    const unsub = subscribeToComments(postId, setComments);
    return unsub;
  }, [postId]);

  const handleComment = async () => {
    if (!text.trim()) return;
    if (!currentUser) { toast.error("Sign in to comment"); return; }
    setPosting(true);
    try {
      await addPostComment(postId, {
        authorUid:      currentUser.uid,
        authorName:     currentUser.displayName || "Anonymous",
        authorInitials: getInitials(currentUser.displayName),
        text:           text.trim(),
      });
      setText("");
    } catch (err) {
      console.error("Comment error:", err);
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
      {comments.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-2">
          No comments yet. Be the first!
        </p>
      )}

      {comments.map((c) => (
        <div key={c.commentId} className="flex gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white text-xs font-bold">
            {c.authorInitials}
          </div>
          <div className="flex-1 rounded-2xl bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{c.authorName}</span>
              <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-700 mt-0.5">{c.text}</p>
          </div>
        </div>
      ))}

      {currentUser ? (
        <div className="flex gap-2 pt-1">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-600 text-white text-xs font-bold">
            {getInitials(currentUser.displayName)}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              placeholder="Write a comment…"
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition"
            />
            <button
              onClick={handleComment}
              disabled={posting || !text.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700 transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center">
          <a href="/login" className="text-blue-600 font-semibold">Sign in</a> to comment
        </p>
      )}
    </div>
  );
}

// ── Share Panel ───────────────────────────────────────────
function SharePanel({ post, onClose }: { post: Post; onClose: () => void }) {
  const network = [
    { name: "Rohit Kulkarni", role: "Local Carpenter · HSR",       initials: "RK" },
    { name: "Sneha Joshi",    role: "School Volunteer · BTM",      initials: "SJ" },
    { name: "Vikram Bhat",    role: "Civil Engineer · Whitefield", initials: "VB" },
    { name: "Anjali Menon",   role: "RWA President · Koramangala", initials: "AM" },
  ];

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-900">Share with your network</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/neighborhood-net?post=${post.postId}`);
          toast.success("Link copied!");
          onClose();
        }}
        className="w-full mb-3 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
      >
        <Share2 className="h-4 w-4" /> Copy link
      </button>

      <div className="space-y-2">
        {network.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              toast.success(`Post shared with ${p.name}`);
              onClose();
            }}
            className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-fuchsia-50 transition text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-xs font-bold shrink-0">
              {p.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
              <div className="text-xs text-slate-500 truncate">{p.role}</div>
            </div>
            <span className="text-xs text-fuchsia-600 font-semibold shrink-0">Send →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Build Network ─────────────────────────────────────────
function BuildNetworkCard() {
  const people = [
    { name: "Rohit Kulkarni", role: "Local Carpenter · HSR",       initials: "RK" },
    { name: "Sneha Joshi",    role: "School Volunteer · BTM",      initials: "SJ" },
    { name: "Vikram Bhat",    role: "Civil Engineer · Whitefield", initials: "VB" },
  ];
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-600">
          <Users className="h-4 w-4" />
        </div>
        <h3 className="font-bold text-slate-900">Build Network</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {people.map((p) => (
          <li key={p.name} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-xs font-bold">
              {p.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
              <div className="text-xs text-slate-500 truncate">{p.role}</div>
            </div>
            <button
              onClick={() => toast(`Friend request sent to ${p.name}`)}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-blue-600 hover:bg-blue-50 transition"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
        View All Suggestions
      </button>
    </div>
  );
}

// ── Influence Card ────────────────────────────────────────
function InfluenceCard({ postsCount }: { postsCount: number }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 p-6 text-white shadow-lg shadow-fuchsia-500/20">
      <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
        Your Civic Influence
      </div>
      <div className="mt-2 text-5xl font-black">Top 5%</div>
      <p className="mt-3 text-sm text-fuchsia-100 leading-relaxed">
        You have made{" "}
        <span className="font-bold text-white">{postsCount} civic post{postsCount !== 1 ? "s" : ""}</span>.
        Your updates inspire neighbours across Bengaluru to take action.
      </p>
    </div>
  );
}