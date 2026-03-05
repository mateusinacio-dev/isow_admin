import { useCallback, useRef, useState } from "react";
import useUpload from "@/utils/useUpload";

const MAX_PROJECT_IMAGES = 4;

export function useImageUpload(setState, setError) {
  const [upload, { loading: uploading }] = useUpload();
  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const fileInputLogoRef = useRef(null);
  const fileInputImagesRef = useRef(null);

  const handlePickLogo = useCallback(() => {
    fileInputLogoRef.current?.click();
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

  const handleAddImages = useCallback(() => {
    fileInputImagesRef.current?.click();
  }, []);

  const handleImagesPicked = useCallback(
    async (e, currentImages) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) {
        return;
      }
      setError(null);

      const current = Array.isArray(currentImages) ? currentImages : [];
      const remaining = MAX_PROJECT_IMAGES - current.length;
      const toUpload = files.slice(0, remaining);

      const uploaded = [];
      for (const f of toUpload) {
        // eslint-disable-next-line no-await-in-loop
        const { url, error: uploadError } = await upload({ file: f });
        if (uploadError) {
          setError(uploadError);
          return;
        }
        uploaded.push(url);
      }

      setState((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploaded].slice(
          0,
          MAX_PROJECT_IMAGES,
        ),
      }));

      try {
        e.target.value = "";
      } catch {
        // ignore
      }
    },
    [upload, setState, setError],
  );

  return {
    uploading,
    cropOpen,
    cropFile,
    fileInputLogoRef,
    fileInputImagesRef,
    handlePickLogo,
    setCropOpen,
    setCropFile,
    onCropConfirm,
    handleAddImages,
    handleImagesPicked,
  };
}
