import { Link } from 'react-router-dom';

function formatINR(paise) {
  if (!paise && paise !== 0) return '—';
  const amount = paise / 100;
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function truncate(str, max = 120) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function CampaignCard({ campaign }) {
  const raised = campaign.raisedAmount || 0;
  const target = campaign.targetAmount || 1;
  const percent = Math.min(100, Math.round((raised / target) * 100));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {campaign.image && (
        <img
          src={campaign.image}
          alt={campaign.title}
          className="w-full h-36 object-cover rounded"
        />
      )}

      <h3 className="font-semibold text-gray-900 text-base leading-snug">
        {campaign.title}
      </h3>

      {campaign.description && (
        <p className="text-sm text-gray-600">
          {truncate(campaign.description)}
        </p>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent}% of goal raised`}
          className="w-full bg-gray-100 rounded-full h-2"
        >
          <div
            className="bg-secondary h-2 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>जुटाए: {formatINR(raised)}</span>
          <span>लक्ष्य: {formatINR(target)}</span>
        </div>
      </div>

      <Link
        to={`/donate/${campaign._id}`}
        className="mt-auto block text-center bg-secondary text-white py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        दान करें / Donate Now
      </Link>
    </div>
  );
}
