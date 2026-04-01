export default function PipelineLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-28 bg-gray-200" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-64 shrink-0 border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-200 px-3 py-2">
              <div className="h-4 w-24 bg-gray-200" />
            </div>
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="border border-gray-100 p-3">
                  <div className="h-3 w-32 bg-gray-100" />
                  <div className="mt-2 h-3 w-20 bg-gray-50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
