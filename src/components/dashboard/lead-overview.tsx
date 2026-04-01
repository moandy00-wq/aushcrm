import type { InterviewData } from '@/types';

interface LeadOverviewProps {
  interviewData: InterviewData | null;
  source: string | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-700">{value || '--'}</dd>
    </div>
  );
}

export function LeadOverview({ interviewData, source }: LeadOverviewProps) {
  if (!interviewData) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No interview data
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Business Name" value={interviewData.business_name} />
        <Field label="Industry" value={interviewData.industry} />
        <Field label="Business Model" value={interviewData.business_model} />
        <Field label="Team Size" value={interviewData.team_size} />
        <Field label="Current Tools" value={interviewData.current_tools} />
        <Field label="Source" value={source} />
        <div className="md:col-span-2">
          <Field label="Goals" value={interviewData.goals} />
        </div>
        <div className="md:col-span-2">
          <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Pain Points
          </dt>
          <dd className="text-sm text-gray-700">
            {interviewData.pain_points.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {interviewData.pain_points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            ) : (
              '--'
            )}
          </dd>
        </div>
        {interviewData.additional_notes && (
          <div className="md:col-span-2">
            <Field label="Additional Notes" value={interviewData.additional_notes} />
          </div>
        )}
      </div>
    </div>
  );
}
