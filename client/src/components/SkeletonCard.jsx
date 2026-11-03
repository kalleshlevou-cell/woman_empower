export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-5 w-3/4 bg-gray-200 rounded" />
      <div className="h-4 w-full bg-gray-200 rounded mt-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mt-1" />
      <div className="h-6 w-16 bg-gray-300 rounded-full mt-3" />
      <div className="h-9 w-full bg-gray-200 rounded mt-4" />
    </div>
  );
}

export function SkeletonCampaignCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-36 w-full bg-gray-200 rounded mb-3" />
      <div className="h-5 w-3/4 bg-gray-200 rounded" />
      <div className="h-4 w-full bg-gray-200 rounded mt-1" />
      <div className="h-4 w-5/6 bg-gray-200 rounded" />
      <div className="h-2 w-full bg-gray-200 rounded-full mt-3" />
      <div className="flex justify-between mt-1">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
      <div className="h-9 w-full bg-gray-200 rounded mt-4" />
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
