import { useCallback, useRef, useState } from "react";
import useUpload from "@/utils/useUpload";

export function useLogoUpload(setForm, setError) {
  const [upload, { loading: uploading }] = useUpload();
  const fileInputRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);

  const handlePickLogo = useCallback(() => {
    if (!fileInputRef.current) {
      return;
    }
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }, []);

  const onCropConfirm = useCallback(
    async (base64) => {
      setCropOpen(false);
      setCropFile(null);

      if (!base64) {
        return;
      }

      setError(null);

      const uploaded = await upload({ base64, name: 'logo' });
      if (uploaded?.error) {
        setError(uploaded.error);
        return;
      }

      const url = uploaded?.url;
      if (!url) {
        setError("Upload falhou.");
        return;
      }

      setForm((prev) => ({ ...prev, logoImageUrl: url }));
    },
    [upload, setForm, setError],
  );

  return {
    uploading,
    fileInputRef,
    cropOpen,
    setCropOpen,
    cropFile,
    setCropFile,
    handlePickLogo,
    onCropConfirm,
  };
}
