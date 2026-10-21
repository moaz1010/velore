const sampleReviews = [
  {
    id: 'sample-review-01',
    isPlaceholder: true,
    text: 'Approved customer feedback will appear here after it is supplied by Velore.',
  },
];

export default function Testimonials() {
  if (!import.meta.env.DEV) return null;
  return (
    <div className="testimonial-grid">
      {sampleReviews.filter((review) => review.isPlaceholder).map((review) => (
        <article className="testimonial-card" key={review.id}>
          <span className="sample-label">Sample review</span>
          <p>{review.text}</p>
        </article>
      ))}
    </div>
  );
}
