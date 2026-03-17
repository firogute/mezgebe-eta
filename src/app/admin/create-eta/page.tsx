"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { createEtaEvent } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const BANK_TYPE_OPTIONS = [
  "Telebirr",
  "CBE",
  "CBE Birr",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Awash Bank",
  "M-Pesa",
  "Amole",
  "Other",
];

export default function CreateEtaPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const router = useRouter();
  const { showToast } = useToast();

  function uploadImageWithProgress(file: File) {
    return new Promise<string>((resolve, reject) => {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads");

      xhr.upload.onprogress = (progressEvent: ProgressEvent<EventTarget>) => {
        if (!progressEvent.lengthComputable) {
          return;
        }
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100,
        );
        setUploadProgress(progress);
      };

      xhr.onload = () => {
        let parsedResponse: { imageUrl?: string; error?: string } = {};
        try {
          parsedResponse = JSON.parse(xhr.responseText) as {
            imageUrl?: string;
            error?: string;
          };
        } catch {
          reject(new Error("Unexpected upload response from server."));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300 && parsedResponse.imageUrl) {
          resolve(parsedResponse.imageUrl);
          return;
        }

        reject(new Error(parsedResponse.error || "Image upload failed."));
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading image."));
      };

      xhr.send(uploadData);
    });
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      setImageUrl("");
      setUploadProgress(0);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      showToast("Please select a valid image file.", "error");
      event.target.value = "";
      setSelectedFileName("");
      setImageUrl("");
      setUploadProgress(0);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Image size must be 5MB or smaller.");
      showToast("Image size must be 5MB or smaller.", "error");
      event.target.value = "";
      setSelectedFileName("");
      setImageUrl("");
      setUploadProgress(0);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setSelectedFileName(file.name);

    try {
      const uploadedImageUrl = await uploadImageWithProgress(file);
      setImageUrl(uploadedImageUrl);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to upload image.";
      setError(message);
      showToast(message, "error");
      setSelectedFileName("");
      setImageUrl("");
      setUploadProgress(0);
      event.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (uploading) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      const data = {
        title: formData.get("title") as string,
        descriptionEn: formData.get("descriptionEn") as string,
        ticketPrice: parseFloat(formData.get("ticketPrice") as string),
        totalTickets: parseInt(formData.get("totalTickets") as string),
        winnerCount: parseInt(formData.get("winnerCount") as string),
        deadline: new Date(formData.get("deadline") as string),
        bankType: formData.get("bankType") as string,
        accountName: formData.get("accountName") as string,
        accountNumber: formData.get("accountNumber") as string,
        image: imageUrl || undefined,
      };

      await createEtaEvent(data);
      showToast("Event created successfully.", "success");
      router.push("/admin");
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to create Eta event";
      setError(message);
      showToast(message, "error");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Create New Eta / Ixa
      </h1>

      <div className="bg-card border border-border rounded-xl p-6">
        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              name="title"
              required
              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="e.g. iPhone 15 Pro Max Raffle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              If you type in English, it will be translated to Amharic
              automatically. If you type in Amharic, no translation will run.
            </p>
            <textarea
              name="descriptionEn"
              required
              rows={3}
              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="Enter event description in English or Amharic..."
            ></textarea>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ticket Price (Birr)
              </label>
              <input
                name="ticketPrice"
                type="number"
                required
                min="1"
                className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Tickets
              </label>
              <input
                name="totalTickets"
                type="number"
                required
                min="1"
                className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Winners
              </label>
              <input
                name="winnerCount"
                type="number"
                required
                min="1"
                defaultValue="1"
                className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input
                name="deadline"
                type="datetime-local"
                required
                className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Image (Optional)
              </label>
              <input
                name="imageFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageChange}
                className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:rounded-md file:cursor-pointer"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Upload JPG, PNG, WEBP, or GIF up to 5MB.
              </p>
              {(selectedFileName || imageUrl) && (
                <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 space-y-3">
                  {selectedFileName && (
                    <p className="text-sm text-foreground">
                      Selected: {selectedFileName}
                    </p>
                  )}
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt="ETA preview"
                      width={640}
                      height={256}
                      className="h-32 w-full rounded-md border border-border object-cover"
                    />
                  )}
                  {uploading && (
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Uploading image... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Payment Account Details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bank Type
                </label>
                <select
                  name="bankType"
                  required
                  className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select bank type
                  </option>
                  {BANK_TYPE_OPTIONS.map((bankType) => (
                    <option key={bankType} value={bankType}>
                      {bankType}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Name
                </label>
                <input
                  name="accountName"
                  required
                  className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Mezgebe Trading PLC"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Number
              </label>
              <input
                name="accountNumber"
                required
                className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter destination account number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full mt-4 bg-primary text-primary-foreground py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Creating Event...
              </>
            ) : uploading ? (
              <>
                <LoadingSpinner />
                Uploading Image...
              </>
            ) : (
              "Create Event & Generate Tickets"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
