export const generateJobCardImage = async (job: any) => {
  const element = document.createElement("div");

  element.style.padding = "20px";
  element.style.width = "600px";
  element.style.fontFamily = "Arial";
  element.style.background = "white";

  element.innerHTML = `
    <h2>Furtherance Technotree Pvt Ltd</h2>
    <hr/>
    <p><b>Job Sheet No:</b> ${job.jobSheetNumber}</p>
    <p><b>Customer Name:</b> ${job.customerName}</p>
    <p><b>Contact:</b> ${job.contactNumber}</p>
    <p><b>Device:</b> ${job.deviceType} - ${job.brandName}</p>
    <p><b>Issues:</b> ${job.issues?.join(", ")}</p>
    <p><b>Estimated Cost:</b> ₹${job.estimatedCost}</p>
    <br/>
    <p>Thank you for choosing Furtherance Technotree</p>
  `;

  document.body.appendChild(element);

  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(element);

  const link = document.createElement("a");

  link.download = `JobCard-${job.jobSheetNumber}.png`;
  link.href = canvas.toDataURL("image/png");

  link.click();

  document.body.removeChild(element);
};