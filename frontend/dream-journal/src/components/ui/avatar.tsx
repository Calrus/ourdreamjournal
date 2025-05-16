import * as React from "react";

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  fallback?: string;
}

export function Avatar({ src, alt, size = 32, className = '', fallback }: AvatarProps) {
  return src ? (
    <img
      src={src}
      alt={alt || 'Profile'}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      {fallback || <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>}
    </div>
  );
} 