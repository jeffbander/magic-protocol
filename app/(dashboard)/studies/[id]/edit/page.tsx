// T063, T067, T068: Edit study page with form and update logic
'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditStudyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phase, setPhase] = useState('');
  const [indication, setIndication] = useState('');
  const [targetEnrollment, setTargetEnrollment] = useState<number | ''>('');
  const [inclusionCriteria, setInclusionCriteria] = useState<string[]>([]);
  const [exclusionCriteria, setExclusionCriteria] = useState<string[]>([]);
  const [visitSchedule, setVisitSchedule] = useState<string[]>([]);

  useEffect(() => {
    async function loadStudy() {
      try {
        const response = await fetch(`/api/studies/${params.id}`);
        if (!response.ok) throw new Error('Failed to load study');

        const study = await response.json();
        setName(study.name);
        setPhase(study.phase || '');
        setIndication(study.indication || '');
        setTargetEnrollment(study.target_enrollment || '');
        setInclusionCriteria(study.protocol_data.inclusion_criteria || []);
        setExclusionCriteria(study.protocol_data.exclusion_criteria || []);
        setVisitSchedule(study.protocol_data.visit_schedule || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStudy();
  }, [params.id]);

  // T067: Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/studies/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phase,
          indication,
          target_enrollment: targetEnrollment === '' ? null : Number(targetEnrollment),
          protocol_data: {
            inclusion_criteria: inclusionCriteria,
            exclusion_criteria: exclusionCriteria,
            visit_schedule: visitSchedule,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update study');
      }

      // T068: Redirect back to detail page
      router.push(`/studies/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-base text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Study</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-base font-medium text-gray-900 mb-2">
            Study Name *
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="phase" className="block text-base font-medium text-gray-900 mb-2">
              Phase
            </label>
            <Input
              id="phase"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              placeholder="e.g., Phase 3"
            />
          </div>

          <div>
            <label htmlFor="targetEnrollment" className="block text-base font-medium text-gray-900 mb-2">
              Target Enrollment
            </label>
            <Input
              id="targetEnrollment"
              type="number"
              value={targetEnrollment}
              onChange={(e) => setTargetEnrollment(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 100"
              min="1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="indication" className="block text-base font-medium text-gray-900 mb-2">
            Indication
          </label>
          <Input
            id="indication"
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            placeholder="e.g., Hypertension"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-base text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/studies/${params.id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
