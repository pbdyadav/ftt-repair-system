import { Job } from "@/types/job";

export const generateBillImage = async (
  job: Job
) => {
  const normalizeServiceItems = (serviceItems: unknown) => {
    if (Array.isArray(serviceItems)) {
      return serviceItems
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          name: typeof item.name === "string" ? item.name.trim() : "",
          qty: Number(item.qty) || 0,
          price: Number(item.price) || 0,
        }))
        .filter((item) => item.name && item.qty > 0);
    }

    if (typeof serviceItems === "string" && serviceItems.trim()) {
      try {
        return normalizeServiceItems(JSON.parse(serviceItems));
      } catch {
        return [];
      }
    }

    return [];
  };

  const normalizedIssues =
    Array.isArray(job.issues)
      ? job.issues
      : typeof job.issues === "string" && job.issues.trim()
        ? job.issues
            .split(",")
            .map((issue) => issue.trim())
            .filter(Boolean)
        : [];

  const normalizedItems =
    normalizeServiceItems(job.serviceItems);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN").format(value);

  const drawRightText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    rightX: number,
    y: number
  ) => {
    const textWidth =
      ctx.measureText(text).width;

    ctx.fillText(
      text,
      rightX - textWidth,
      y
    );
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    let lines = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine =
        line + words[n] + " ";

      const metrics =
        ctx.measureText(testLine);

      const testWidth =
        metrics.width;

      if (
        testWidth > maxWidth &&
        n > 0
      ) {
        ctx.fillText(
          line,
          x,
          y
        );

        line =
          words[n] + " ";

        y += lineHeight;

        lines++;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, y);

    return lines + 1;
  };

  const drawRowText = (
    text: string,
    rightX: number,
    y: number
  ) => {
    drawRightText(
      ctx,
      text,
      rightX,
      y
    );
  };
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

  // Logo

  const logo =
    new Image();

  logo.src = "/logo.png";

  await new Promise(
    (resolve) => {
      logo.onload = resolve;
    }
  );

  // Watermark

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

  // Header logo

  ctx.drawImage(
    logo,
    40, 30, 80, 80
  );

  ctx.fillStyle = "black";

  ctx.font =
    "bold 22px Arial";

  ctx.fillText(
    "Furtherance Technotree Pvt Ltd",
    140, 60
  );

  ctx.font =
    "14px Arial";

  ctx.fillText(
    "UG-13, A Block Silver Mall, Indore - 452001",
    140, 85
  );

  ctx.fillText(
    "Contact: 92001 11400",
    140, 105
  );

  // Customer

  ctx.fillText(
    `Customer: ${job.customerName}`,
    50, 160
  );

  ctx.fillText(
    `Phone: ${job.contactNumber}`,
    50, 185
  );

  ctx.fillText(
    `Bill Date: ${new Date().toLocaleDateString()}`,
    500, 160
  );

  ctx.fillText(
    `Bill No: ${job.jobSheetNumber}`,
    500, 185
  );

  // Service Type

  ctx.fillText(
    `Service Type: ${job.serviceType || "Paid"
    }`,
    50, 210
  );

  const tableLeft = 40;
  const tableRight = 750;
  const tableTop = 230;
  const tableHeaderBottom = 270;
  const snoRight = 120;
  const particularRight = 450;
  const qtyRight = 520;
  const priceRight = 625;
  const minimumTableBottom = 530;

  // Header

  ctx.font =
    "bold 14px Arial";

  ctx.fillText(
    "S.No",
    60, 260
  );

  ctx.fillText(
    "Particular",
    160, 260
  );

  ctx.fillText(
    "Qty",
    460, 260
  );

  ctx.fillText(
    "Price",
    540, 260
  );

  ctx.fillText(
    "Amount",
    640, 260
  );

  // Header line

  ctx.beginPath();

  ctx.moveTo(
    tableLeft, tableHeaderBottom
  );

  ctx.lineTo(
    tableRight, tableHeaderBottom
  );

  ctx.stroke();

  // Items

  let startY = 270;

  let total = 0;

  const items =
    normalizedItems.length > 0
      ? normalizedItems
      : [
        {
          name:
            normalizedIssues.join(
              ", "
            ) ||
            "Repair Service",
          qty: 1,
          price:
            job.finalCost || 0
        }
      ];

  ctx.font =
    "14px Arial";

  startY = 270;
  total = 0;

  items.forEach(
    (item, index) => {
      const amount =
        item.qty * item.price;
      const rowTop =
        startY;
      const textTop =
        rowTop + 26;

      total += amount;

      ctx.fillText(
        (index + 1).toString(),
        60,
        textTop
      );

      // WRAPPED PARTICULAR TEXT

      const lines =
        wrapText(
          ctx,
          item.name,
          160,
          textTop,
          270,
          18
        );

      drawRowText(
        item.qty.toString(),
        500,
        textTop
      );

      drawRowText(
        `₹ ${formatCurrency(item.price)}`,
        605,
        textTop
      );

      drawRowText(
        `₹ ${formatCurrency(amount)}`,
        730,
        textTop
      );

      const rowHeight =
        Math.max(lines * 18 + 20, 38);

      startY += rowHeight;

      // Row line

      ctx.beginPath();

      ctx.moveTo(
        tableLeft,
        startY
      );

      ctx.lineTo(
        tableRight,
        startY
      );

      ctx.stroke();

      startY += 10;
    }
  );

  const tableBottom =
    Math.max(startY, minimumTableBottom);

  ctx.strokeRect(
    tableLeft,
    tableTop,
    tableRight - tableLeft,
    tableBottom - tableTop
  );

  ctx.beginPath();

  ctx.moveTo(
    snoRight,
    tableTop
  );
  ctx.lineTo(
    snoRight,
    tableBottom
  );

  ctx.moveTo(
    particularRight,
    tableTop
  );
  ctx.lineTo(
    particularRight,
    tableBottom
  );

  ctx.moveTo(
    qtyRight,
    tableTop
  );
  ctx.lineTo(
    qtyRight,
    tableBottom
  );

  ctx.moveTo(
    priceRight,
    tableTop
  );
  ctx.lineTo(
    priceRight,
    tableBottom
  );

  ctx.stroke();

  const totalBoxTop =
    tableBottom + 24;
  const totalBoxLeft = 420;
  const totalBoxWidth = 330;
  const totalBoxHeight = 48;

  ctx.fillStyle = "#f5f7fb";
  ctx.fillRect(
    totalBoxLeft,
    totalBoxTop,
    totalBoxWidth,
    totalBoxHeight
  );

  ctx.strokeRect(
    totalBoxLeft,
    totalBoxTop,
    totalBoxWidth,
    totalBoxHeight
  );

  ctx.fillStyle = "black";
  ctx.font =
    "bold 16px Arial";

  ctx.fillText(
    "Total Amount",
    totalBoxLeft + 16,
    totalBoxTop + 30
  );

  drawRightText(
    ctx,
    `₹ ${formatCurrency(total)}`,
    totalBoxLeft + totalBoxWidth - 16,
    totalBoxTop + 30
  );

  // Footer

  ctx.font =
    "14px Arial";

  ctx.fillText(
    "Authorized Signature",
    520, totalBoxTop + 110
  );

  // QR

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
    520, totalBoxTop + 150, 200, 200
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.8
  );
};
