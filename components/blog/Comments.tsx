'use client';

import React from "react";

interface CommentsProps {
  blogId: string;
}

const Comments: React.FC<CommentsProps> = ({ blogId }) => {
  if (!blogId) return null;

  return (
    <section className="mt-12 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Comments</h3>
      <p className="text-sm text-gray-600">
        Commenting functionality is not enabled yet for this article.
      </p>
    </section>
  );
};

export default Comments;



