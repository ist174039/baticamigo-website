import { PrivatePageHeading } from "./private-page-heading";

/** Shared page frame inherited by authenticated Area and Admin routes. */
export function PrivateWorkspaceTemplate({ id, eyebrow, title, description, action, className = "", headingClassName = "", children }) {
  return (
    <main id={id} tabIndex={-1} className={`private-workspace-page ${className}`.trim()}>
      {(eyebrow || title || description || action) && (
        <PrivatePageHeading className={headingClassName} eyebrow={eyebrow} title={title} description={description} action={action} />
      )}
      {children}
    </main>
  );
}
