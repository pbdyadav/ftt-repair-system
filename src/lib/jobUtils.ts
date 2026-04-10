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
    ...jobs.map((job) => parseInt(job.jobSheetNumber.split('-')[1]))
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
    data.forEach((job) => {
      if (typeof job.issues === 'string') {
        job.issues = job.issues.split(',').map((i) => i.trim());
      }
    });
  }

  if (error) {
    console.error('Error fetching jobs:', error.message);
    return [];
  }

  return data.map((job) => ({
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
    const isNew = !job.id || job.id === "";

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
      job.issues = job.issues.map((i) => i.trim());
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

    // ✅ Ensure issues and cost are clean
    const jobToSave = {
      ...job,
      issues: Array.isArray(job.issues) ? job.issues.join(', ') : job.issues,
      estimatedCost:
        job.estimatedCost && !isNaN(Number(job.estimatedCost))
          ? Number(job.estimatedCost)
          : 0,
      finalCost:
        job.finalCost && !isNaN(Number(job.finalCost))
          ? Number(job.finalCost)
          : null,
    };

    // ✅ Insert or update job
    let response;
    if (existingJob) {
      response = await supabase.from('jobs').update(jobToSave).eq('id', job.id).select();
    } else {
      response = await supabase.from('jobs').insert([jobToSave]).select();
    }

    if (response.error) {
      console.error('❌ Supabase save error:', response.error.message);
      alert('❌ Failed to save job: ' + response.error.message);
      return;
    }

    console.log('✅ Job saved successfully:', response.data);

    // 🔹 Send WhatsApp based on job type or status
    const savedJob =
      response.data && response.data.length > 0
        ? response.data[0]
        : job;

    const isNewJob = !existingJob;
    if (isNewJob) {
      try {
        console.log("🔄 Generating Job Card for new job...");

        // Ensure Job Sheet Number exists before generating image
        if (!savedJob.jobSheetNumber) {
          savedJob.jobSheetNumber = await generateJobSheetNumber();
        }
        // STEP 1 — Generate image + upload to Supabase
        const imageURL =
          await generateJobSheetImageAndUpload(savedJob);

        console.log("✅ Job Card URL:", imageURL);

        // STEP 2 — Send WhatsApp with URL
        if (imageURL) {
          const message = `Dear ${savedJob.customerName},

Your ${savedJob.deviceType} has been received at FTT Repairing Center.

Job Sheet No: ${savedJob.jobSheetNumber}

Download your Job Card:
${imageURL}

Thank you for choosing FTT Repairing Center.`;

          const phone =
            savedJob.contactNumber?.replace(/\D/g, "");

          if (phone) {
            const encodedMessage =
              encodeURIComponent(message);

            const whatsappURL =
              `https://wa.me/91${phone}?text=${encodedMessage}`;

            window.open(whatsappURL, "_blank");
          }
        } else {
          console.error(
            "❌ Job Card URL not generated"
          );
        }
      } catch (error) {
        console.error(
          "⚠️ Auto job card send error:",
          error
        );
      }
    } else if (
      savedJob.status?.toLowerCase() === "delivered"
    ) {
      sendWhatsAppNotification(
        savedJob,
        "delivered"
      );
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
  finalCost?: number,
  paymentMode?: string
): Promise<Job | null> => {
  try {
    const updateFields: Partial<Job> = {
  status,

  finalCost,

  updatedAt: new Date(),

  completedAt:
    status === 'Completed'
      ? new Date()
      : undefined,

  paymentMode:
    status === "Delivered"
      ? paymentMode
      : undefined,

  paymentDate:
    status === "Delivered"
      ? new Date()
      : undefined,
};

    const { data, error } = await supabase
      .from('jobs')
      .update(updateFields)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    // Send WhatsApp if status changed to completed or delivered
    if (status === 'Completed') {
  sendWhatsAppNotification(
    { ...(data as Job), finalCost: finalCost ?? data.finalCost },
    'completed'
  );
}

// ❌ Do NOT send WhatsApp automatically for Delivered

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
      message = `Dear ${job.customerName}, your ${job.deviceType} repair is complete. The final cost is ₹${job.finalCost ?? 0}. Thank you for your patience! Now you can collect your product.`;
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
  return jobs.filter((job) => {
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
/* ===========================================================
   🔹 7. Generate Job Card Image + Upload to Supabase
   =========================================================== */

export const generateJobSheetImageAndUpload = async (
  job: Job
): Promise<string | null> => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 600;
    canvas.height = 700;

    if (!ctx) return null;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load logo watermark
    const logo = new Image();
    logo.src = "/logo.png";

    await new Promise((resolve) => {
      logo.onload = resolve;
    });

    // Watermark settings
    const watermarkWidth = canvas.width * 0.25;

    const watermarkHeight =
      (logo.height / logo.width) * watermarkWidth;

    ctx.globalAlpha = 0.12;

    ctx.drawImage(
      logo,
      canvas.width / 2 - watermarkWidth / 2,
      canvas.height / 2 - watermarkHeight / 2,
      watermarkWidth,
      watermarkHeight
    );

    ctx.globalAlpha = 1;

    // Text settings
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";

    let y = 120;

    const line = (text: string, maxWidth = 440) => {
      const words = text.split(" ");
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + " ";
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(currentLine, 80, y);
          currentLine = words[i] + " ";
          y += 32;
        } else {
          currentLine = testLine;
        }
      }

      ctx.fillText(currentLine, 80, y);
      y += 32;
    };

    ctx.font = "bold 28px Arial";
    ctx.fillText("FTT Repair Job Card", 220, 60);

    ctx.font = "20px Arial";

    line(`Job Sheet No: ${job.jobSheetNumber}`);
    line(`Customer: ${job.customerName}`);
    line(`Phone: ${job.contactNumber}`);
    line(`Device: ${job.deviceType}`);
    line(`Brand: ${job.brandName}`);

    line(
      `Issues: ${Array.isArray(job.issues)
        ? job.issues.join(", ")
        : job.issues
      }`
    );

    line(`Estimated Cost: ₹${job.estimatedCost ?? 0}`);
    line(`Status: ${job.status}`);

    // Convert to compressed JPEG
    const blob: Blob | null = await new Promise(
      (resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          "image/jpeg",
          0.7
        );
      }
    );

    if (!blob) return null;

    const fileName =
      job.jobSheetNumber +
      "_" +
      Date.now() +
      ".jpg";

    // Upload to Supabase Storage
    const { error } =
      await supabase.storage
        .from("jobcards")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true
        });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("jobcards")
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};
