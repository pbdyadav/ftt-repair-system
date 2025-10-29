import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import JobForm from '@/components/JobForm';
import { Job } from '@/types/job';
import { generateJobSheetNumber, saveJob, sendWhatsAppNotification } from '@/lib/jobUtils';

const NewJob: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // ✅ make this async since it calls await functions
  const handleSubmit = async (jobData: Partial<Job>) => {
    try {
      // ✅ Wait for job sheet number (fixes [object Promise])
      const jobSheetNumber = await generateJobSheetNumber();

      const newJob: Job = {
        id: crypto.randomUUID(),
        jobSheetNumber, // ✅ now a real string like "FTT-00001"
        customerName: jobData.customerName!,
        contactNumber: jobData.contactNumber!,
        deviceType: jobData.deviceType!,
        brandName: jobData.brandName!,
        issues: jobData.issues!,
        attendedBy: currentUser?.name || jobData.attendedBy!,
        estimatedCost: jobData.estimatedCost!,
        finalCost: jobData.finalCost || 0,
        status: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      // ✅ Save job to Supabase
      await saveJob(newJob);

      // ✅ Send WhatsApp confirmation
      sendWhatsAppNotification(newJob, 'created');

      // ✅ Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Error creating job:', error);
      alert('❌ Failed to create job. Please check console for details.');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Repair Job</h1>
          <p className="text-gray-600 mt-1">
            Fill in the details to create a new repair job entry
          </p>
        </div>

        {/* ✅ Pass correct props to JobForm */}
        <JobForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </Layout>
  );
};

export default NewJob;
