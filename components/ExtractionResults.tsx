// T027: ExtractionResults component to display extracted data
'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ExtractedProtocolData } from '@/types/database.types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ExtractionResultsProps {
  data: ExtractedProtocolData;
}

export function ExtractionResults({ data }: ExtractionResultsProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // T031: Confirm & Create Study button handler
  const handleConfirm = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phase: data.phase,
          indication: data.indication,
          target_enrollment: data.target_enrollment,
          protocol_data: {
            inclusion_criteria: data.inclusion_criteria,
            exclusion_criteria: data.exclusion_criteria,
            visit_schedule: data.visit_schedule,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create study');
      }

      const study = await response.json();

      // T032: Redirect to study detail page
      router.push(`/studies/${study.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the study');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Extraction Results</h2>
        <Button onClick={() => window.location.reload()} variant="secondary">
          Upload Another
        </Button>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Study Name */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Study Name</h3>
            <p className="text-base text-gray-700">{data.name}</p>
          </div>

          {/* Phase */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Phase</h3>
            <p className="text-base text-gray-700">{data.phase || 'Not specified'}</p>
          </div>

          {/* Indication */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Indication</h3>
            <p className="text-base text-gray-700">{data.indication || 'Not specified'}</p>
          </div>

          {/* Target Enrollment */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Target Enrollment</h3>
            <p className="text-base text-gray-700">
              {data.target_enrollment ? `${data.target_enrollment} patients` : 'Not specified'}
            </p>
          </div>

          {/* Inclusion Criteria */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Inclusion Criteria</h3>
            <ul className="list-disc list-inside space-y-2">
              {data.inclusion_criteria.map((criterion, index) => (
                <li key={index} className="text-base text-gray-700">
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusion Criteria */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Exclusion Criteria</h3>
            <ul className="list-disc list-inside space-y-2">
              {data.exclusion_criteria.map((criterion, index) => (
                <li key={index} className="text-base text-gray-700">
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Schedule */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Visit Schedule</h3>
            <ul className="list-disc list-inside space-y-2">
              {data.visit_schedule.map((visit, index) => (
                <li key={index} className="text-base text-gray-700">
                  {visit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-base text-red-600">{error}</p>
        </div>
      )}

      <Button onClick={handleConfirm} disabled={isCreating} className="w-full">
        {isCreating ? 'Creating Study...' : 'Confirm & Create Study'}
      </Button>
    </div>
  );
}
