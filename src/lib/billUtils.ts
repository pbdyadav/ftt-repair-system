import { supabase } from "./supabaseClient";
import { generateBillImage } from "@/utils/generateBillImage";
import { Job } from "@/types/job";

const dataUrlToBlob = (dataUrl: string) => {
    const [header, base64Data] = dataUrl.split(",");

    if (!header || !base64Data) {
        throw new Error("Invalid bill image data");
    }

    const mimeMatch =
        header.match(/data:(.*?);base64/);

    const mimeType =
        mimeMatch?.[1] || "image/jpeg";

    const binary =
        atob(base64Data);

    const bytes =
        new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], {
        type: mimeType
    });
};

export const generateBillAndUpload = async (
    job: Job
) => {
    try {
        console.log("Generating bill image");

        const dataUrl =
            await generateBillImage(job);

        const blob =
            dataUrlToBlob(dataUrl);

        const fileName =
            `bill-${job.jobSheetNumber}-${Date.now()}.jpg`;

        const { error } = await supabase.storage
            .from("jobcards")
            .upload(fileName, blob, {
                contentType: "image/jpeg",
                upsert: true
            });

        if (error) {
            console.error(
                "Bill upload storage error:",
                error
            );
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
