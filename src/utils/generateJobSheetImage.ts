import html2canvas from "html2canvas";

/**
 * Generates an image of the job sheet with your logo and details.
 * Returns a Blob URL that can be shared/downloaded.
 */
export async function generateJobSheetImage(job) {
  const sheet = document.createElement("div");
  sheet.style.width = "600px";
  sheet.style.padding = "20px";
  sheet.style.background = "white";
  sheet.style.fontFamily = "Arial, sans-serif";
  sheet.style.border = "2px solid #0047AB";
  sheet.style.borderRadius = "10px";
  sheet.innerHTML = `
    <div style="text-align:center; margin-bottom:10px;">
      <img src="/logo.png" alt="FTT Logo" style="height:60px;" />
      <h2 style="margin:5px 0; color:#0047AB;">FTT Repairing Center</h2>
      <p style="margin:0; font-size:12px;">Reliable Laptop & CCTV Services</p>
    </div>

    <hr style="margin:10px 0;"/>

    <h3 style="text-align:center;">Job Sheet</h3>
    <p><b>Job Sheet No:</b> ${job.jobSheetNumber}</p>
    <p><b>Customer Name:</b> ${job.customerName}</p>
    <p><b>Contact:</b> ${job.contactNumber}</p>
    <p><b>Device:</b> ${job.deviceType} (${job.brandName})</p>
    <p><b>Issues:</b> ${Array.isArray(job.issues) ? job.issues.join(", ") : job.issues}</p>
    <p><b>Attended By:</b> ${job.attendedBy}</p>
    <p><b>Estimated Cost:</b> ₹${job.estimatedCost ?? 0}</p>
    <p><b>Status:</b> ${job.status}</p>

    <hr style="margin:10px 0;"/>

    <p style="font-size:12px;text-align:center;color:#555;">Thank you for choosing FTT Repairing Center!</p>
  `;

  document.body.appendChild(sheet);

  const canvas = await html2canvas(sheet);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const imageURL = URL.createObjectURL(blob);

  document.body.removeChild(sheet);
  return imageURL;
}
