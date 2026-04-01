export default function TeamLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 bg-gray-200" />
        <div className="h-9 w-32 bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="space-y-1">
                <div className="h-4 w-28 bg-gray-200" />
                <div className="h-3 w-36 bg-gray-100" />
              </div>
            </div>
            <div className="h-5 w-16 bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
