import { Job } from "@/types/job";

export const generateBillImage = async (
  job: Job
) => {
  const canvas =
    document.createElement("canvas");

  canvas.width = 794;
  canvas.height = 1123;

  const ctx =
    canvas.getContext("2d");

  if (!ctx)
    throw new Error(
      "Canvas not supported"
    );

  // Background

  ctx.fillStyle = "#ffffff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Watermark

  const logo =
    new Image();

  logo.src = "/logo.png";

  await new Promise(
    (resolve) => {
      logo.onload = resolve;
    }
  );

  const watermarkWidth =
    canvas.width * 0.25;

  const watermarkHeight =
    (logo.height /
      logo.width) *
    watermarkWidth;

  ctx.globalAlpha = 0.12;

  ctx.drawImage(
    logo,
    canvas.width / 2 -
      watermarkWidth / 2,
    canvas.height / 2 -
      watermarkHeight / 2,
    watermarkWidth,
    watermarkHeight
  );

  ctx.globalAlpha = 1;

  // Header Logo

  ctx.drawImage(
    logo,
    40,
    30,
    80,
    80
  );

  // Company Name

  ctx.fillStyle = "black";

  ctx.font =
    "bold 22px Arial";

  ctx.fillText(
    "Furtherance Technotree Pvt Ltd",
    140,
    60
  );

  ctx.font =
    "14px Arial";

  ctx.fillText(
    "UG-13, A Block Silver Mall, Indore - 452001",
    140,
    85
  );

  ctx.fillText(
    "Contact: 92001 11400",
    140,
    105
  );

  // Customer details

  ctx.fillText(
    `Customer: ${job.customerName}`,
    50,
    160
  );

  ctx.fillText(
    `Phone: ${job.contactNumber}`,
    50,
    185
  );

  ctx.fillText(
    `Bill Date: ${new Date().toLocaleDateString()}`,
    500,
    160
  );

  ctx.fillText(
    `Bill No: ${job.jobSheetNumber}`,
    500,
    185
  );

  // Table border

  ctx.strokeRect(
    40,
    220,
    710,
    200
  );

  // Header row

  ctx.font =
    "bold 14px Arial";

  ctx.fillText(
    "S.No",
    60,
    250
  );

  ctx.fillText(
    "Particular",
    140,
    250
  );

  ctx.fillText(
    "Qty",
    430,
    250
  );

  ctx.fillText(
    "Price",
    500,
    250
  );

  ctx.fillText(
    "Amount",
    600,
    250
  );

  // Row line

  ctx.beginPath();

  ctx.moveTo(
    40,
    260
  );

  ctx.lineTo(
    750,
    260
  );

  ctx.stroke();

  // Data row

  ctx.font =
    "14px Arial";

  ctx.fillText(
    "1",
    60,
    300
  );

  ctx.fillText(
    job.problemDescription ||
      "Repair Service",
    140,
    300
  );

  ctx.fillText(
    "1",
    430,
    300
  );

  ctx.fillText(
    job.finalCost?.toString() ||
      "0",
    500,
    300
  );

  ctx.fillText(
    job.finalCost?.toString() ||
      "0",
    600,
    300
  );

  // Total

  ctx.font =
    "bold 16px Arial";

  ctx.fillText(
    `Total Amount: ₹ ${
      job.finalCost || 0
    }`,
    450,
    460
  );

  // QR bigger

  const qr =
    new Image();

  qr.src = "/qr.png";

  await new Promise(
    (resolve) => {
      qr.onload = resolve;
    }
  );

  ctx.drawImage(
    qr,
    520,
    850,
    200,
    200
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.8
  );
};