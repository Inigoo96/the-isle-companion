// Gondwa brand mark: a landmass with topographic contour lines.
export function GondwaMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#0F6E56" />
      <path d="M9 20 C8 14 13 10 19 12 C23 13 25 9 29 12 C34 15 35 20 31 24 C28 28 23 28 20 25 C17 22 13 28 11 24 C8 22 9 21 9 20 Z"
            fill="#EFE7D6" />
      <ellipse cx="20" cy="19" rx="6" ry="4.5" fill="none" stroke="#0F6E56" strokeWidth="2" />
    </svg>
  );
}
