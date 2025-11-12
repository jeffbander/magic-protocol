// T055, T058-T062, T066: Study detail page with tabbed interface
import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function StudyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // T056: Fetch study with owner details
  const { data: study, error } = await supabase
    .from('studies')
    .select('*, owner:users!owner_id(*)')
    .eq('id', params.id)
    .single();

  if (error || !study) {
    notFound();
  }

  // Check if current user is owner or admin for edit button
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session!.user.id)
    .single();

  const canEdit = study.owner_id === session!.user.id || userData?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* T059: Study header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{study.name}</h1>
        <p className="text-base text-gray-600">
          Owner: {study.owner.name} ({study.owner.email})
        </p>
      </div>

      {/* T058: Tabbed interface */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        {/* T059-T062: Overview tab content */}
        <TabsContent value="overview">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {/* T066: Edit button for owner/admin */}
            {canEdit && (
              <div className="mb-6">
                <Link href={`/studies/${study.id}/edit`}>
                  <Button variant="secondary">Edit Study</Button>
                </Link>
              </div>
            )}

            <div className="space-y-6">
              {/* Phase and Indication */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Phase</h3>
                  <p className="text-base text-gray-700">{study.phase || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Indication</h3>
                  <p className="text-base text-gray-700">{study.indication || 'Not specified'}</p>
                </div>
              </div>

              {/* Target Enrollment */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Target Enrollment</h3>
                <p className="text-base text-gray-700">
                  {study.target_enrollment ? `${study.target_enrollment} patients` : 'Not specified'}
                </p>
              </div>

              {/* T060: Inclusion Criteria */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Inclusion Criteria</h3>
                <ul className="list-disc list-inside space-y-2">
                  {study.protocol_data.inclusion_criteria.map((criterion: string, index: number) => (
                    <li key={index} className="text-base text-gray-700 ml-4">
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* T061: Exclusion Criteria */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Exclusion Criteria</h3>
                <ul className="list-disc list-inside space-y-2">
                  {study.protocol_data.exclusion_criteria.map((criterion: string, index: number) => (
                    <li key={index} className="text-base text-gray-700 ml-4">
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* T062: Visit Schedule */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Visit Schedule</h3>
                <ul className="list-disc list-inside space-y-2">
                  {study.protocol_data.visit_schedule.map((visit: string, index: number) => (
                    <li key={index} className="text-base text-gray-700 ml-4">
                      {visit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Team tab - placeholder for Phase 7 */}
        <TabsContent value="team">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-base text-gray-600">Team management - Phase 7</p>
          </div>
        </TabsContent>

        {/* Patients tab - placeholder for Phase 8 */}
        <TabsContent value="patients">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-base text-gray-600">Patient tracking - Phase 8</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
