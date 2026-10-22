export function PrivatePageHeading({ eyebrow, title, description, action, className = "" }) {
  return (
    <header className={`private-page-heading ${className}`.trim()}>
      <div className="private-page-heading-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="private-page-heading-actions">{action}</div>}
    </header>
  );
}
