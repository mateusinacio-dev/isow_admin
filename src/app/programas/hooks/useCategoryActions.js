import { useCallback } from "react";
import {
  buildDefaultBenefitsCategory,
  buildDefaultContinuousCategory,
} from "../utils/programConfigParser";

export function useCategoryActions({ setState }) {
  const addCategory = useCallback(() => {
    setState((prev) => {
      const next = { ...prev };
      const cats = Array.isArray(next.categories) ? [...next.categories] : [];
      cats.push(
        next.kind === "CONTINUOUS"
          ? buildDefaultContinuousCategory()
          : buildDefaultBenefitsCategory(),
      );
      next.categories = cats;
      return next;
    });
  }, [setState]);

  const removeCategory = useCallback(
    (idx) => {
      setState((prev) => {
        const cats = Array.isArray(prev.categories) ? [...prev.categories] : [];
        cats.splice(idx, 1);
        return {
          ...prev,
          categories:
            cats.length > 0
              ? cats
              : prev.kind === "CONTINUOUS"
                ? [buildDefaultContinuousCategory()]
                : [buildDefaultBenefitsCategory()],
        };
      });
    },
    [setState],
  );

  const setCategoryField = useCallback(
    (idx, field, value) => {
      // NEW: virtual field used by the "Minha escolha" toggle
      if (idx === -1 && field === "__autoChoiceEnabled") {
        setState((prev) => ({ ...prev, autoChoiceEnabled: Boolean(value) }));
        return;
      }

      setState((prev) => {
        const cats = Array.isArray(prev.categories) ? [...prev.categories] : [];
        const row = { ...(cats[idx] || {}) };
        row[field] = value;
        cats[idx] = row;
        return { ...prev, categories: cats };
      });
    },
    [setState],
  );

  const addBenefitRow = useCallback(
    (catIdx) => {
      setState((prev) => {
        const cats = Array.isArray(prev.categories) ? [...prev.categories] : [];
        const row = { ...(cats[catIdx] || buildDefaultBenefitsCategory()) };
        const benefits = Array.isArray(row.benefits) ? [...row.benefits] : [];
        benefits.push({ label: "", quantity: "" });
        row.benefits = benefits;
        row.benefitsEnabled = true;
        cats[catIdx] = row;
        return { ...prev, categories: cats };
      });
    },
    [setState],
  );

  const setBenefitField = useCallback(
    (catIdx, benefitIdx, field, value) => {
      setState((prev) => {
        const cats = Array.isArray(prev.categories) ? [...prev.categories] : [];
        const row = { ...(cats[catIdx] || buildDefaultBenefitsCategory()) };
        const benefits = Array.isArray(row.benefits) ? [...row.benefits] : [];
        const b = { ...(benefits[benefitIdx] || {}) };
        b[field] = value;
        benefits[benefitIdx] = b;
        row.benefits = benefits;
        row.benefitsEnabled = true;
        cats[catIdx] = row;
        return { ...prev, categories: cats };
      });
    },
    [setState],
  );

  const removeBenefitRow = useCallback(
    (catIdx, benefitIdx) => {
      setState((prev) => {
        const cats = Array.isArray(prev.categories) ? [...prev.categories] : [];
        const row = { ...(cats[catIdx] || buildDefaultBenefitsCategory()) };
        const benefits = Array.isArray(row.benefits) ? [...row.benefits] : [];
        benefits.splice(benefitIdx, 1);
        row.benefits = benefits.length
          ? benefits
          : [{ label: "", quantity: "" }];
        cats[catIdx] = row;
        return { ...prev, categories: cats };
      });
    },
    [setState],
  );

  return {
    addCategory,
    removeCategory,
    setCategoryField,
    addBenefitRow,
    setBenefitField,
    removeBenefitRow,
  };
}
