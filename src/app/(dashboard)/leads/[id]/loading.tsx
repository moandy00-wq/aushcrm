export default function LeadDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 bg-gray-200" />
        <div className="h-7 w-56 bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-gray-200 bg-white p-4 space-y-3">
            <div className="h-4 w-32 bg-gray-200" />
            <div className="h-4 w-full bg-gray-100" />
            <div className="h-4 w-3/4 bg-gray-100" />
          </div>
          <div className="border border-gray-200 bg-white p-4 space-y-3">
            <div className="h-4 w-24 bg-gray-200" />
            <div className="h-20 w-full bg-gray-100" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="border border-gray-200 bg-white p-4 space-y-3">
            <div className="h-4 w-20 bg-gray-200" />
            <div className="h-4 w-full bg-gray-100" />
            <div className="h-4 w-2/3 bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
