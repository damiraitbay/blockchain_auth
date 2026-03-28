export function SkeletonLines({ className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden="true">
      <div className="h-3 w-full rounded-full bg-gradient-to-r from-border-subtle via-border to-border-subtle bg-[length:200%_100%] animate-shimmer" />
      <div className="h-3 w-3/5 rounded-full bg-gradient-to-r from-border-subtle via-border to-border-subtle bg-[length:200%_100%] animate-shimmer" />
      <div className="h-3 w-4/5 rounded-full bg-gradient-to-r from-border-subtle via-border to-border-subtle bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}
