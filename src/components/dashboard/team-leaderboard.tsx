import type { TeamLeaderboardEntry } from '@/lib/queries/analytics';

interface TeamLeaderboardProps {
  entries: TeamLeaderboardEntry[];
}

export function TeamLeaderboard({ entries }: TeamLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        No team assignments yet
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Team Leaderboard</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-4 py-2 font-medium text-gray-500">Name</th>
            <th className="px-4 py-2 font-medium text-gray-500 text-right">Assigned</th>
            <th className="px-4 py-2 font-medium text-gray-500 text-right">Converted</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.name} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-2 text-gray-900">{entry.name}</td>
              <td className="px-4 py-2 text-gray-600 text-right">{entry.total}</td>
              <td className="px-4 py-2 text-gray-600 text-right">{entry.converted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
