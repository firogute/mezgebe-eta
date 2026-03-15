"use client";

import Image from "next/image";
import { useState } from "react";
import { submitPayment } from "@/lib/actions/submitPayment";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function PaymentForm({
  reservationId,
}: {
  reservationId: string;
}) {
  const [method, setMethod] = useState("Telebirr");
  const [referenceLink, setReferenceLink] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const primaryMethods = ["Telebirr", "CBE", "CBE Birr"];
  const secondaryMethods = ["Awash Bank", "Amole", "Other"];

  function uploadReceiptWithProgress(file: File) {
    return new Promise<string>((resolve, reject) => {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads/payment");

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

        reject(new Error(parsedResponse.error || "Receipt upload failed."));
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading receipt."));
      };

      xhr.send(uploadData);
    });
  }

  async function handleReceiptFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      setReceiptImageUrl("");
      setUploadProgress(0);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file for receipt upload.");
      setSelectedFileName("");
      setReceiptImageUrl("");
      setUploadProgress(0);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Receipt image size must be 5MB or smaller.");
      setSelectedFileName("");
      setReceiptImageUrl("");
      setUploadProgress(0);
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setSelectedFileName(file.name);

    try {
      const imageUrl = await uploadReceiptWithProgress(file);
      setReceiptImageUrl(imageUrl);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to upload receipt image.",
      );
      setSelectedFileName("");
      setReceiptImageUrl("");
      setUploadProgress(0);
      event.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploading) {
      setError("Please wait for the receipt upload to finish.");
      return;
    }

    if (!receiptImageUrl) {
      setError("Please upload your payment receipt image first.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await submitPayment({
      reservationId,
      method,
      receiptImageUrl,
      referenceLink: referenceLink || undefined,
    });
    if (res.success) {
      router.push("/receipt"); // Redirect to receipt check page
    } else {
      setError(res.error || "Failed to submit.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Select Payment Method
        </label>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            Primary Options
          </p>
          <div className="grid grid-cols-3 gap-2">
            {primaryMethods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${
                  method === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider pt-2">
            Secondary Options
          </p>
          <div className="grid grid-cols-3 gap-2">
            {secondaryMethods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${
                  method === m
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Receipt Image Upload
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Upload a screenshot/photo of your paid receipt (stored on Supabase).
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleReceiptFileChange}
            className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:rounded-md file:cursor-pointer"
            disabled={loading || uploading}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG, WEBP, GIF up to 5MB.
          </p>
        </div>

        {(selectedFileName || receiptImageUrl) && (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-3">
            {selectedFileName && (
              <p className="text-sm text-foreground">
                Selected: {selectedFileName}
              </p>
            )}
            {receiptImageUrl && (
              <Image
                src={receiptImageUrl}
                alt="Receipt preview"
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
                  Uploading receipt... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Bank/Reference Link (Optional)
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          If your bank/app gives a payment link or transaction URL, add it here.
          We verify links using Leul Verifier and block duplicate paid
          references.
        </p>
        <input
          type="url"
          value={referenceLink}
          onChange={(e) => setReferenceLink(e.target.value)}
          placeholder="https://..."
          className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full bg-accent text-accent-foreground py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Submitting...
          </>
        ) : uploading ? (
          <>
            <LoadingSpinner />
            Uploading Receipt...
          </>
        ) : (
          "Submit Payment for Verification"
        )}
      </button>
    </form>
  );
}
