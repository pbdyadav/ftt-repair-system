import { supabase } from "./supabaseClient";
import { generateBillImage } from "@/utils/generateBillImage";
import { Job } from "@/types/job";

export const generateBillAndUpload = async (
    job: Job
) => {
    try {
        console.log("Generating bill image");

        const dataUrl =
            await generateBillImage(job);

        const response = await fetch(dataUrl);

        const blob = await response.blob();

        const fileName =
            `bill-${job.jobSheetNumber}.jpg`;

        const { error } = await supabase.storage
  .from("jobcards")
  .upload(fileName, blob, {
    upsert: true
  });

        if (error) {
            console.error(error);
            return null;
        }

        const { data } =
            supabase.storage
                .from("jobcards")
                .getPublicUrl(fileName);

        return data.publicUrl;

    } catch (err) {
        console.error(
            "Bill upload failed:",
            err
        );
        return null;
    }
};