import { useCallback, useState } from "react";
import useUpload from "@/utils/useUpload";

export function useProgramUploads({ setState, setError }) {
  const [upload, { loading: uploading }] = useUpload();
  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);

  const onPickLogoFile = useCallback((e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      return;
    }
    setCropFile(f);
    setCropOpen(true);
  }, []);

  const onCropConfirm = useCallback(
    async (base64) => {
      setCropOpen(false);
      if (!base64) {
        return;
      }
      setError(null);

      const { url, error: uploadError } = await upload({ base64 });
      if (uploadError) {
        setError(uploadError);
        return;
      }

      setState((prev) => ({ ...prev, logoImageUrl: url }));
    },
    [upload, setState, setError],
  );

  const onPickAttachment = useCallback(
    async (e) => {
      const f = e.target.files?.[0] || null;
      if (!f) {
        return;
      }
      setError(null);

      const { url, error: uploadError } = await upload({ file: f });
      if (uploadError) {
        setError(uploadError);
        return;
      }

      setState((prev) => ({
        ...prev,
        attachmentUrl: url,
        hasAttachment: true,
      }));
    },
    [upload, setState, setError],
  );

  return {
    uploading,
    cropOpen,
    cropFile,
    setCropOpen,
    onPickLogoFile,
    onCropConfirm,
    onPickAttachment,
  };
}
