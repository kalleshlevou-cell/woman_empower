export default function LoadingSpinner({ size = 40 }) {
  return (
    <div className="flex items-center justify-center p-4">
      <svg
        role="status"
        aria-label="Loading"
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle cx="20" cy="20" r="16" stroke="#F5A623" strokeWidth="4" strokeOpacity="0.2" />
        <path
          d="M20 4 A16 16 0 0 1 36 20"
          stroke="#C47F00"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
