import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const needColors = {
  health:     'bg-green-100 text-green-800',
  livelihood: 'bg-blue-100 text-blue-800',
  pension:    'bg-orange-100 text-orange-800',
  maternity:  'bg-pink-100 text-pink-800',
  education:  'bg-purple-100 text-purple-800',
  housing:    'bg-yellow-100 text-yellow-800',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

export default function SchemeCard({ scheme, lang: langProp, showDraftBadge = false }) {
  const { lang: ctxLang } = useLanguage();
  const lang = langProp || ctxLang;
  const t = (en, hi) => lang === 'hi' ? hi : en;

  const title = lang === 'hi'
    ? (scheme.title_hi || scheme.title_en)
    : (scheme.title_en || scheme.title_hi);

  const need = scheme.need || scheme.category;
  const badgeClass = needColors[need] || 'bg-gray-100 text-gray-700';

  return (
    <article
      role="article"
      aria-label={title}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">{title}</h3>
        <div className="flex flex-col gap-1 items-end flex-shrink-0">
          {need && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{need}</span>
          )}
          {showDraftBadge && scheme.status === 'draft' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">Draft</span>
          )}
          {scheme.matchLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
              {t('Possible Match', scheme.matchLabel)}
            </span>
          )}
        </div>
      </div>

      {(scheme.description_en || scheme.description_hi) && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {lang === 'hi'
            ? (scheme.description_hi || scheme.description_en)
            : (scheme.description_en || scheme.description_hi)}
        </p>
      )}

      <div className="text-xs text-gray-400 flex items-center gap-1">
        <span>{t('Source:', 'स्रोत:')}</span>
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
        ) : <span>—</span>}
      </div>

      {scheme.lastCheckedAt && (
        <p className="text-xs text-gray-400">
          {t('Last verified:', 'अंतिम जाँच:')} {formatDate(scheme.lastCheckedAt)}
        </p>
      )}

      <Link
        to={`/schemes/${scheme._id}`}
        className="mt-auto inline-block text-sm font-medium text-secondary hover:underline focus:outline-none focus:ring-2 focus:ring-secondary rounded"
        aria-label={`View details for ${title}`}
      >
        {t('View Details →', 'विवरण देखें →')}
      </Link>
    </article>
  );
}
