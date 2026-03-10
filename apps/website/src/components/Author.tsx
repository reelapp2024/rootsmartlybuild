import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_PROJECT_URL || "https://apis.smartlybuild.dev";
const AUTHOR_API_URL = `${API_URL}/admin/v1/fetch_author_by_blog_id`; // Endpoint to fetch the author

type Author = {
  name: string;
  jobTitle?: string;
  bio?: string;
  image?: string;
  links: Array<{
    label: string;
    url: string;
  }>;
};

type AuthorComponentProps = {
  blogId: string;
};

const AuthorComponent: React.FC<AuthorComponentProps> = ({ blogId }) => {
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthor = async () => {
    if (!blogId) {
      setError("Blog ID is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(AUTHOR_API_URL, { blogId });
      setAuthor(response.data?.data); // Assuming response contains author data
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch author");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthor();
  }, [blogId]);

  if (loading) {
    return (
      <section className="nx-card nx-author max-w-6xl mx-auto p-6" aria-label="About the author">
        <div className="nx-author-inner">
          <div className="nx-author-avatar bg-gray-200" style={{ width: 80, height: 80 }} />
          <div>
            <h3 className="nx-h3 bg-gray-200 h-6 w-1/3" />
            <p className="nx-author-meta bg-gray-200 h-4 w-1/2" />
            <p className="nx-author-bio bg-gray-200 h-4 w-3/4" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !author) {
    return (
      <section className="nx-card nx-author max-w-6xl mx-auto p-6" aria-label="About the author">
        <div className="nx-author-inner">
          <div>
            <h3 className="nx-h3">About the Author</h3>
            {error ? <p>{error}</p> : <p>No author information available.</p>}
          </div>
        </div>
      </section>
    );
  }

  // Concatenate the base API_URL with the image URL to form the full image URL
  const imageUrl = author.image ? `${API_URL}${author.image}` : '';

  return (
    <section className="nx-card nx-author max-w-6xl mx-auto p-6" aria-label="About the author">
      <div className="nx-author-inner">
        {author.image && <img className="nx-author-avatar" src={imageUrl} alt={author.name} />}
        <div>
          <h3 className="nx-h3">About the Author</h3>
          {author.name && (
            <p className="nx-author-meta">
              Written by <strong>{author.name}</strong>
              {author.jobTitle && ` — ${author.jobTitle}`}
            </p>
          )}
          {author.bio && <p className="nx-author-bio">{author.bio}</p>}
          {author.links?.length > 0 && (
            <div className="nx-author-links">
              {author.links.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthorComponent;
