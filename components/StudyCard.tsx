// T049, T050: StudyCard component with study info, hover state, and click handler
'use client';

import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import type { Study } from '@/types/database.types';

interface StudyCardProps {
  study: Study & {
    team_member_count?: number;
    patient_count?: number;
  };
}

export function StudyCard({ study }: StudyCardProps) {
  const router = useRouter();

  // T050: Click handler to navigate to study detail page
  const handleClick = () => {
    router.push(`/studies/${study.id}`);
  };

  return (
    <Card hoverable onClick={handleClick}>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{study.name}</h2>

      <div className="space-y-2 mt-4">
        <p className="text-base text-gray-600">
          <span className="font-medium">Phase:</span> {study.phase || 'Not specified'}
        </p>

        {study.indication && (
          <p className="text-base text-gray-600">
            <span className="font-medium">Indication:</span> {study.indication}
          </p>
        )}

        <p className="text-base text-gray-600">
          <span className="font-medium">Target Enrollment:</span>{' '}
          {study.target_enrollment ? `${study.target_enrollment} patients` : 'Not specified'}
        </p>

        {study.team_member_count !== undefined && (
          <p className="text-base text-gray-600">
            <span className="font-medium">Team Members:</span> {study.team_member_count}
          </p>
        )}

        {study.patient_count !== undefined && (
          <p className="text-base text-gray-600">
            <span className="font-medium">Enrolled:</span> {study.patient_count} /{' '}
            {study.target_enrollment || 0}
          </p>
        )}

        <p className="text-base text-gray-500 mt-4">
          Created: {new Date(study.created_at).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
