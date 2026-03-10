
import { useSchemaMarkup } from '@/hooks/useSchemaMarkup';
import { generateReviewSchema, generateAggregateRatingSchema } from '@/utils/schemaGenerator';

const TestimonialsSchemaMarkup = () => {
  // Review data from TestimonialsSection
  const reviews = [
    {
      author: 'Alice Johnson',
      rating: 5,
      reviewBody: 'I had a great experience with US Plumbers. They were professional and efficient in fixing my plumbing issues.',
      datePublished: '2024-01-15'
    },
    {
      author: 'John Smith',
      rating: 5,
      reviewBody: 'US Plumbers exceeded my expectations. Their team was knowledgeable and provided top-notch service.',
      datePublished: '2024-01-20'
    },
    {
      author: 'Emily Davis',
      rating: 5,
      reviewBody: 'I was satisfied with the plumbing services provided by US Plumbers. They were prompt and resolved the issue quickly.',
      datePublished: '2024-01-25'
    },
    {
      author: 'Michael Brown',
      rating: 5,
      reviewBody: 'US Plumbers did a fantastic job fixing a leak in my bathroom. I would highly recommend their services.',
      datePublished: '2024-02-01'
    },
    {
      author: 'Sarah Wilson',
      rating: 5,
      reviewBody: 'I was impressed with the professionalism of US Plumbers. They were courteous and efficient in their work.',
      datePublished: '2024-02-05'
    }
  ];

  // Generate review schemas
  const reviewSchemas = generateReviewSchema(reviews);

  // Generate aggregate rating
  const aggregateRating = generateAggregateRatingSchema({
    ratingValue: 5.0,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1
  });

  // Apply schemas
  useSchemaMarkup({ "@graph": reviewSchemas }, 'reviews');
  useSchemaMarkup(aggregateRating, 'aggregate-rating');

  return null;
};

export default TestimonialsSchemaMarkup;
