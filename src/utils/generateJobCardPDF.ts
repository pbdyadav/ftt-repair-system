import jsPDF from "jspdf";

export const generateJobCardPDF = (job: any) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Furtherance Technotree Pvt Ltd", 20, 20);

  doc.setFontSize(12);

  doc.text(`Job Sheet No: ${job.jobSheetNumber}`, 20, 40);
  doc.text(`Customer Name: ${job.customerName}`, 20, 50);
  doc.text(`Contact: ${job.contactNumber}`, 20, 60);

  doc.text(`Device: ${job.deviceType} - ${job.brandName}`, 20, 70);

  doc.text("Issues:", 20, 80);

  job.issues.forEach((issue: string, index: number) => {
    doc.text(`- ${issue}`, 25, 90 + index * 10);
  });

  doc.text(`Estimated Cost: ₹${job.estimatedCost}`, 20, 130);

  if (job.finalCost) {
    doc.text(`Final Cost: ₹${job.finalCost}`, 20, 140);
  }

  const fileName = `JobCard-${job.jobSheetNumber}.pdf`;

  doc.save(fileName);

  return fileName;
};