import { supabase } from '@/lib/supabaseClient';
import { Job } from '@/types/job';

const normalizeServiceItems = (serviceItems: unknown) => {
  if (Array.isArray(serviceItems)) {
    return serviceItems
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        name: typeof item.name === 'string' ? item.name : '',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
      }));
  }

  if (typeof serviceItems === 'string' && serviceItems.trim()) {
    try {
      const parsed = JSON.parse(serviceItems);
      return normalizeServiceItems(parsed);
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeIssues = (issues: unknown) => {
  if (Array.isArray(issues)) {
    return issues.map((issue) => String(issue).trim()).filter(Boolean);
  }

  if (typeof issues === 'string' && issues.trim()) {
    return issues.split(',').map((issue) => issue.trim()).filter(Boolean);
  }

  return [];
};

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
      job.issues = normalizeIssues(job.issues);
      job.serviceItems = normalizeServiceItems(job.serviceItems);
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
export const saveJob = async (job: Job): Promise<boolean> => {
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
    job.issues = normalizeIssues(job.issues);

    // ✅ Ensure issues and cost are clean
    const jobToSave = {
      ...job,
      issues: normalizeIssues(job.issues).join(', '),
      serviceItems: normalizeServiceItems(job.serviceItems)
        .map((item) => ({
          name: item.name.trim(),
          qty: Number(item.qty) || 0,
          price: Number(item.price) || 0,
        }))
        .filter((item) => item.name && item.qty > 0),
      estimatedCost:
        job.estimatedCost && !isNaN(Number(job.estimatedCost))
          ? Number(job.estimatedCost)
          : 0,
      finalCost:
        job.finalCost && !isNaN(Number(job.finalCost))
          ? Number(job.finalCost)
          : null,
      warrantyStartDate: job.warrantyStartDate?.trim()
        ? job.warrantyStartDate
        : null,
      warrantyEndDate: job.warrantyEndDate?.trim()
        ? job.warrantyEndDate
        : null,
      amcStartDate: job.amcStartDate?.trim()
        ? job.amcStartDate
        : null,
      amcEndDate: job.amcEndDate?.trim()
        ? job.amcEndDate
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
      return false;
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
    return true;
  } catch (error) {
    console.error('⚠️ Error saving job:', error);
    return false;
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

    const normalizedData: Job = {
      ...(data as Job),
      issues: normalizeIssues(data.issues),
      serviceItems: normalizeServiceItems(data.serviceItems),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
    };

    // Send WhatsApp if status changed to completed or delivered
    if (status === 'Completed') {
  sendWhatsAppNotification(
    { ...normalizedData, finalCost: finalCost ?? normalizedData.finalCost },
    'completed'
  );
}

// ❌ Do NOT send WhatsApp automatically for Delivered

    return normalizedData;
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
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    const roundRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const wrapText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number
    ) => {
      const words = text.split(" ");
      let line = "";
      let currentY = y;

      words.forEach((word, index) => {
        const testLine = `${line}${word} `;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && index > 0) {
          ctx.fillText(line.trim(), x, currentY);
          line = `${word} `;
          currentY += lineHeight;
          return;
        }

        line = testLine;
      });

      if (line.trim()) {
        ctx.fillText(line.trim(), x, currentY);
      }

      return currentY;
    };

    const drawLaptopWatermark = () => {
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 16;

      roundRect(ctx, 470, 355, 650, 360, 34);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(440, 760);
      ctx.lineTo(1180, 760);
      ctx.lineTo(1220, 835);
      ctx.lineTo(400, 835);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1600;
    canvas.height = 1080;

    if (!ctx) return null;

    const [logo, themeImage, qrImage] = await Promise.all([
      loadImage("/FTTlogo.png"),
      loadImage("/cardtheem.png"),
      loadImage("/fqr.png"),
    ]);

    const formattedIssues = Array.isArray(job.issues)
      ? job.issues.join(", ")
      : job.issues || "-";

    const statusPalette: Record<string, { bg: string; text: string }> = {
      Pending: { bg: "#FEF3C7", text: "#92400E" },
      "In Progress": { bg: "#DBEAFE", text: "#1D4ED8" },
      Completed: { bg: "#DCFCE7", text: "#166534" },
      Delivered: { bg: "#E5E7EB", text: "#111827" },
    };

    const statusColors =
      statusPalette[job.status] || statusPalette.Pending;

    ctx.fillStyle = "#f4f6fb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    roundRect(ctx, 20, 20, 1560, 1040, 28);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(20, 20, 1560, 1040);
    ctx.drawImage(themeImage, 1380, 20, 200, 1040);
    ctx.restore();

    ctx.drawImage(logo, 70, 92, 430, 120);

    ctx.fillStyle = "#6B7280";
    ctx.font = "500 28px Arial";
    ctx.fillText("All IT Solutions & Services", 78, 240);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 62px Arial";
    ctx.fillText("JOB SHEET", 1095, 155);

    ctx.fillStyle = "#E91E63";
    ctx.font = "bold 42px Arial";
    ctx.fillText(`# ${job.jobSheetNumber}`, 1192, 222);

    ctx.strokeStyle = "#EEF2F7";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(78, 300);
    ctx.lineTo(1420, 300);
    ctx.stroke();

    drawLaptopWatermark();

    const labelX = 78;
    const valueX = 385;
    const infoTop = 390;
    const rowGap = 92;
    const contactLabelX = 860;
    const contactValueX = 1020;
    const labelFont = "bold 28px Arial";
    const valueFont = "500 36px Arial";
    const valueLineHeight = 40;

    ctx.fillStyle = "#475569";
    ctx.font = labelFont;
    ctx.fillText("CUSTOMER NAME:-", labelX, infoTop);
    ctx.fillText("CONTACT:-", contactLabelX, infoTop);

    ctx.fillStyle = "#1F2937";
    ctx.font = valueFont;
    wrapText(job.customerName || "-", valueX, infoTop + 4, 380, valueLineHeight);
    wrapText(job.contactNumber || "-", contactValueX, infoTop + 4, 220, valueLineHeight);

    const rows = [
      { label: "DEVICE/WORK:-", value: `${job.deviceType} (${job.brandName || "-"})`, maxWidth: 700 },
      { label: "ISSUES/SERVICE:-", value: formattedIssues, maxWidth: 700 },
      { label: "ATTENDED BY:-", value: job.attendedBy || "-", maxWidth: 700 },
    ];

    let currentRowY = infoTop + rowGap;
    let attendedByBottomY = currentRowY;

    rows.forEach((row, index) => {
      ctx.fillStyle = "#475569";
      ctx.font = labelFont;
      ctx.fillText(row.label, labelX, currentRowY);

      ctx.fillStyle = "#1F2937";
      ctx.font = valueFont;
      const textBottomY = wrapText(
        row.value,
        valueX,
        currentRowY + 4,
        row.maxWidth,
        valueLineHeight
      );

      if (index === rows.length - 1) {
        attendedByBottomY = textBottomY;
      }

      currentRowY = textBottomY + 48;
    });

    const estimatedCostLabelY = attendedByBottomY + 72;
    const estimatedCostValueY = estimatedCostLabelY + 18;
    const statusLabelY = estimatedCostLabelY + 95;
    const statusBadgeY = statusLabelY - 35;
    const statusTextY = statusLabelY + 1;
    const footerLineY = Math.max(statusLabelY + 70, 905);
    const footerTextY = footerLineY + 60;
    const footerThanksY = footerLineY + 97;

    ctx.fillStyle = "#475569";
    ctx.font = labelFont;
    ctx.fillText("ESTIMATED COST:-", labelX, estimatedCostLabelY);

    ctx.fillStyle = "#111111";
    ctx.font = "bold 45px Arial";
    ctx.fillText(`₹ ${new Intl.NumberFormat("en-IN").format(job.estimatedCost ?? 0)}`, valueX, estimatedCostValueY);

    ctx.fillStyle = "#475569";
    ctx.font = labelFont;
    ctx.fillText("STATUS:-", labelX, statusLabelY);

    roundRect(ctx, valueX, statusBadgeY, 190, 52, 26);
    ctx.fillStyle = statusColors.bg;
    ctx.fill();

    ctx.fillStyle = statusColors.text;
    ctx.font = "bold 28px Arial";
    ctx.fillText(job.status.toUpperCase(), valueX + 22, statusTextY);

    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 1140, 405, 310, 310, 26);
    ctx.fill();

    ctx.drawImage(qrImage, 1154, 419, 284, 284);

    ctx.fillStyle = "#1F2937";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Scan for More Info", 1172, 748);

    ctx.strokeStyle = "#EEF2F7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(78, footerLineY);
    ctx.lineTo(1420, footerLineY);
    ctx.stroke();

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "500 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "I hereby acknowledge that I am bound by FTT REPAIRING CENTER terms and conditions.",
      760,
      footerTextY
    );

    ctx.fillStyle = "#6B7280";
    ctx.font = "bold 22px Arial";
    ctx.fillText(
      "Thank you for choosing Furtherance Technotree.",
      760,
      footerThanksY
    );
    ctx.textAlign = "start";

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
