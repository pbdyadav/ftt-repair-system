import { supabase } from '@/lib/supabaseClient';
import { Job } from '@/types/job';

/* ===========================================================
   🔹 1. Generate Unique Job Sheet Number (FTT-00001 format)
   =========================================================== */
export const generateJobSheetNumber = async (): Promise<string> => {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('jobSheetNumber');

  if (error || !jobs || jobs.length === 0) {
    return 'FTT-00001';
  }

  const lastNumber = Math.max(
    ...jobs.map(job => parseInt(job.jobSheetNumber.split('-')[1]))
  );
  const nextNumber = lastNumber + 1;
  return `FTT-${nextNumber.toString().padStart(5, '0')}`;
};

/* ===========================================================
   🔹 2. Fetch jobs (from Supabase)
   =========================================================== */
export const getStoredJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase.from('jobs').select('*');
  if (data) {
    data.forEach(job => {
      if (typeof job.issues === 'string') {
        job.issues = job.issues.split(',').map(i => i.trim());
      }
    });
  }

  if (error) {
    console.error('Error fetching jobs:', error.message);
    return [];
  }

  return data.map(job => ({
    ...job,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
    completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
  }));
};

/* ===========================================================
   🔹 3. Save or update a job (to Supabase) + WhatsApp
   =========================================================== */
export const saveJob = async (job: Job): Promise<void> => {
  try {
    const isNew = !job.id; // Detect new job

    if (isNew) {
      job.id = crypto.randomUUID();
    }

    // Check if job already exists
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', job.id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking existing job:', fetchError.message);
    }

    // 🧹 Clean up issues field before saving
    if (Array.isArray(job.issues)) {
      job.issues = job.issues.map(i => i.trim());
    } else if (typeof job.issues === 'string') {
      try {
        const parsed = JSON.parse(job.issues);
        job.issues = Array.isArray(parsed)
          ? parsed.map((i: string) => i.trim())
          : [job.issues];
      } catch {
        job.issues = [job.issues];
      }
    }

    // ✅ Ensure issues stored cleanly
    const jobToSave = {
  ...job,
  issues: Array.isArray(job.issues) ? job.issues.join(', ') : job.issues,
  estimatedCost: job.estimatedCost ? Number(job.estimatedCost) : 0,
  finalCost: job.finalCost ? Number(job.finalCost) : null,
};

    // ✅ Insert or update job
    let response;
    if (existingJob) {
      response = await supabase.from('jobs').update(jobToSave).eq('id', job.id);
    } else {
      response = await supabase.from('jobs').insert([jobToSave]);
    }

    if (response.error) {
      console.error('❌ Supabase save error:', response.error.message);
      alert('❌ Failed to save job: ' + response.error.message);
      return;
    }

    console.log('✅ Job saved successfully:', response.data);

    // 🔹 Send WhatsApp based on job type or status
    if (isNew) {
      sendWhatsAppNotification(job, 'created');
    } else if (job.status?.toLowerCase() === 'completed') {
      sendWhatsAppNotification(job, 'completed');
    } else if (job.status?.toLowerCase() === 'delivered') {
      sendWhatsAppNotification(job, 'delivered');
    }
  } catch (error) {
    console.error('⚠️ Error saving job:', error);
  }
};


/* ===========================================================
   🔹 4. Update job status (Completed / Delivered / etc.)
   =========================================================== */
export const updateJobStatus = async (
  jobId: string,
  status: Job['status'],
  finalCost?: number
): Promise<Job | null> => {
  try {
    const updateFields: Partial<Job> = {
      status,
      finalCost,
      updatedAt: new Date(),
      completedAt: status === 'Completed' ? new Date() : undefined,
    };

    const { data, error } = await supabase
      .from('jobs')
      .update(updateFields)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    // Send WhatsApp if status changed to completed or delivered
    if (status === 'Completed' || status === 'Delivered') {
      sendWhatsAppNotification(
        { ...(data as Job), finalCost: finalCost ?? data.finalCost },
        status.toLowerCase() as 'completed' | 'delivered'
      );
    }

    return data;
  } catch (error) {
    console.error('Error updating job status:', error);
    return null;
  }
};

/* ===========================================================
   🔹 5. Send WhatsApp Notification
   =========================================================== */
export const sendWhatsAppNotification = (
  job: Job,
  type: 'created' | 'completed' | 'delivered'
): void => {
  try {
    let message = '';

    if (type === 'created') {
      message = `Dear ${job.customerName}, your ${job.deviceType} has been received at FTT Repairing Center. Your Job Sheet No. is ${job.jobSheetNumber}. The estimated repair cost is ₹${job.estimatedCost ?? 0}. We'll contact you once the repair is complete.`;
    } else if (type === 'completed') {
      message = `Dear ${job.customerName}, your ${job.deviceType} repair is complete. The final cost is ₹${job.finalCost ?? 0}. Thank you for your patience! Now you can collect your product`;
    } else if (type === 'delivered') {
      message = `Dear ${job.customerName}, your ${job.deviceType} has been successfully delivered. Thank you for choosing FTT Repairing Center!`;
    }

    const phone = job.contactNumber?.replace(/\D/g, '');
    if (!phone) return;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/91${phone}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
};

/* ===========================================================
   🔹 6. Filter Jobs (for dashboard filters)
   =========================================================== */
interface JobFilters {
  status?: Job['status'];
  engineerName?: string;
  searchTerm?: string;
  dateRange?: { start: Date; end: Date };
}

export const filterJobs = (jobs: Job[], filters: JobFilters): Job[] => {
  return jobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false;
    if (filters.engineerName && job.attendedBy !== filters.engineerName)
      return false;

    if (filters.searchTerm) {
      const s = filters.searchTerm.toLowerCase();
      const matches =
        job.customerName.toLowerCase().includes(s) ||
        job.jobSheetNumber.toLowerCase().includes(s) ||
        job.contactNumber.includes(s) ||
        job.brandName.toLowerCase().includes(s);
      if (!matches) return false;
    }

    if (filters.dateRange) {
      const jobDate = new Date(job.createdAt);
      if (
        jobDate < filters.dateRange.start ||
        jobDate > filters.dateRange.end
      )
        return false;
    }

    return true;
  });
};
