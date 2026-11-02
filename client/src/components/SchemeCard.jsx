import { Link } from 'react-router-dom';

const needColors = {
  health: 'bg-green-100 text-green-800',
  livelihood: 'bg-blue-100 text-blue-800',
  pension: 'bg-orange-100 text-orange-800',
  maternity: 'bg-pink-100 text-pink-800',
  education: 'bg-purple-100 text-purple-800',
  housing: 'bg-yellow-100 text-yellow-800',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function SchemeCard({ scheme, lang = 'hi', showDraftBadge = false }) {
  const title = lang === 'hi' ? (scheme.title_hi || scheme.title_en) : (scheme.title_en || scheme.title_hi);
  const need = scheme.need || scheme.category;
  const badgeClass = needColors[need] || 'bg-gray-100 text-gray-700';

  return (
    <article
      role="article"
      aria-label={title}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">
          {title}
        </h3>
        <div className="flex flex-col gap-1 items-end flex-shrink-0">
          {need && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
              {need}
            </span>
          )}
          {showDraftBadge && scheme.status === 'draft' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
              Draft
            </span>
          )}
          {scheme.matchLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
              {scheme.matchLabel}
            </span>
          )}
        </div>
      </div>

      {scheme.description_en && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {scheme.description_en}
        </p>
      )}

      <div className="text-xs text-gray-400 flex items-center gap-1">
        <span>स्रोत:</span>
        {scheme.officialUrl ? (
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline truncate max-w-[160px]"
            aria-label="Official source link"
          >
            {scheme.officialUrl.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        ) : (
          <span>—</span>
        )}
      </div>

      {scheme.lastCheckedAt && (
        <p className="text-xs text-gray-400">
          अंतिम जाँच: {formatDate(scheme.lastCheckedAt)}
        </p>
      )}

      <Link
        to={`/schemes/${scheme._id}`}
        className="mt-auto inline-block text-sm font-medium text-secondary hover:underline"
        aria-label={`View details for ${title}`}
      >
        विवरण देखें / View Details →
      </Link>
    </article>
  );
}
