import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_URL = import.meta.env.VITE_PROJECT_URL || "https://apis.smartlybuild.dev";
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

interface Comment {
  _id: string;
  user: { fullName: string; image?: string };
  rating: number;
  reviewText: string;
  verified: boolean;
}

const Comments: React.FC<{ blogId: string }> = ({ blogId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(5); // start with 5 visible
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(5);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load comments (10 at a time)
  const loadComments = async (newPage = 1, append = false) => {
    try {
      setLoadingMore(true);
      const res = await axios.post(`${API_URL}/webapp/v1/get_reviews`, {
        blogId,
        projectId: PROJECT_ID,
        page: newPage,
        limit: 10,
      });

      const { data, paginationData } = res.data;
      setTotalPages(paginationData.pages || 1);

      if (append) {
        setComments((prev) => [...prev, ...data]);
      } else {
        setComments(data || []);
      }

      setPage(newPage);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (blogId) loadComments(1);
  }, [blogId]);

  // Send OTP
  const sendOtp = async () => {
    try {
      setSendingOtp(true);
      await axios.post(`${API_URL}/webapp/v1/send_otp`, { email, projectId: PROJECT_ID });
      toast.success("OTP sent to email");
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    try {
      setVerifyingOtp(true);
      const res = await axios.post(`${API_URL}/webapp/v1/verify_otp`, { email, otp });
      if (res.status === 200) {
        setOtpVerified(true);
        localStorage.setItem("userEmail", email);
        toast.success("Email verified successfully!");
      } else {
        toast.error("Invalid OTP");
      }
    } catch {
      toast.error("Error verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Post review
  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("blogId", blogId);
      formData.append("fullName", name); // ✅ fix: use fullName
      formData.append("email", email);
      formData.append("rating", rating.toString());
      formData.append("reviewText", commentText); // ✅ fix: use reviewText

      await axios.post(`${API_URL}/webapp/v1/add_review`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Review sent for approval successfully");
      setCommentText("");
      setRating(5);
      loadComments(1);
      setVisibleCount(5);
    } catch (err) {
      console.error(err);
      toast.error("Failed to post review");
    } finally {
      setLoading(false);
    }
  };

  // Handle load more logic
  const handleLoadMore = () => {
    if (visibleCount < comments.length) {
      // show next 5 from current batch
      setVisibleCount((prev) => prev + 5);
    } else if (page < totalPages) {
      // fetch next batch
      loadComments(page + 1, true);
      setVisibleCount((prev) => prev + 5); // show 5 more when loaded
    }
  };

  return (
    <section className="nx-card nx-comments max-w-6xl mx-auto p-6">
      <Toaster position="top-right" />

      <h2 className="nx-h2 mb-4">Comments & Reviews</h2>

      {/* Review summary */}
      <div className="mb-4 text-gray-600">
        <strong>{comments.length}</strong> review(s) loaded
      </div>

      {/* Form */}
      <form onSubmit={postComment} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium">Name</label>
          <input
            className="border rounded p-2 w-[360px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium">Email</label>
          <div className="flex gap-2">
            <input
              className="border rounded p-2 w-[360px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!otpVerified && email && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp}
                className="px-3 py-2 bg-gray-200 rounded"
              >
                {sendingOtp ? "Sending..." : "Send OTP"}
              </button>
            )}
          </div>
        </div>

        {/* OTP */}
        {!otpVerified && email && (
          <div>
            <label className="block font-medium">OTP</label>
            <div className="flex gap-2">
              <input
                className="border rounded p-2 w-[180px]"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                type="button"
                onClick={verifyOtp}
                disabled={verifyingOtp}
                className="px-3 py-2 bg-blue-500 text-white rounded"
              >
                {verifyingOtp ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block font-medium">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                className={`cursor-pointer text-2xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block font-medium">Comment</label>
          <textarea
            className="border rounded p-2 w-[360px]"
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Posting..." : "Post Review"}
        </button>
      </form>

      {/* Comments */}
      <div className="mt-8">
        <h3 className="font-semibold mb-3">Reviews</h3>
        {comments.length === 0 && <p>No reviews yet.</p>}
        <ul className="space-y-3">
          {comments.slice(0, visibleCount).map((c) => (
            <li key={c._id} className="border p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                {c.user?.image && (
                  <img
                    src={c.user.image}
                    alt={c.user.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="font-medium">{c.user?.fullName}</span>
                {c.verified && <span className="text-blue-500">✔</span>}
              </div>
              <div className="text-yellow-400">
                {"★".repeat(c.rating)}{" "}
                <span className="text-gray-400">
                  {"★".repeat(5 - c.rating)}
                </span>
              </div>
              <p className="text-gray-700">{c.reviewText}</p>
            </li>
          ))}
        </ul>

        {/* Load more */}
        {(visibleCount < comments.length || page < totalPages) && (
          <button
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more reviews"}
          </button>
        )}
      </div>
    </section>
  );
};

export default Comments;
