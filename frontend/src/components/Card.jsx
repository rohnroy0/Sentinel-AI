// Generic Card — semantic white/dark surface that follows the active theme.
export default function Card({ as: Tag = 'div', className = '', padding = 'p-5', children, ...props }) {
  return (
    <Tag
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm ${padding} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
