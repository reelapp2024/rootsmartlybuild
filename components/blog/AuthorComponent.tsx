'use client';

import React from "react";

interface AuthorComponentProps {
  blogId: string;
}

const AuthorComponent: React.FC<AuthorComponentProps> = () => {
  return (
    <section className="mt-12 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">About the Author</h3>
      <p className="text-sm text-gray-600">
        Author details will appear here soon. Stay tuned!
      </p>
    </section>
  );
};

export default AuthorComponent;



