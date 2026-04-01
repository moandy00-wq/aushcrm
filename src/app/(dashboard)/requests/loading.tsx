export default function RequestsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-28 bg-gray-200" />
      <div className="border border-gray-200 bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
          >
            <div className="h-4 w-32 bg-gray-100" />
            <div className="h-4 w-24 bg-gray-50" />
            <div className="h-4 w-20 bg-gray-100" />
            <div className="ml-auto h-4 w-16 bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
