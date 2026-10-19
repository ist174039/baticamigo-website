export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className={`section-heading${light ? " is-light" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
