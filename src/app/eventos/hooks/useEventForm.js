import { useState, useEffect } from "react";
import { formatDateInput, formatTimeInput } from "../utils/dateFormatters";
import { buildDefaultCategory } from "../utils/ticketUtils";

export function useEventForm(initialEvent) {
  const [state, setState] = useState(() => {
    const e = initialEvent?.event || initialEvent || null;
    const config = e?.adminConfig || {};
    const visibility = config?.visibility || {};
    const ticketing = config?.ticketing || {};
    const extra = config?.extra || {};

    const start = e?.startDate || null;
    const end = e?.endDate || null;

    const programAllocation = ticketing?.programAllocation || {};

    return {
      name: e?.name || "",
      shortDescription: e?.shortDescription || "",
      longDescription: e?.longDescription || "",

      // location
      placeName: e?.attendanceAddress?.placeName || "",
      street: e?.attendanceAddress?.street || "",
      streetNumber: e?.attendanceAddress?.number || "",
      city: e?.attendanceAddress?.city || "",
      stateCode: e?.attendanceAddress?.state || "",

      relatedProgramEventId: e?.relatedProgramEventId || "",

      logoImageUrl: e?.logoImageUrl || "",
      coverImageUrl: e?.coverImageUrl || "",

      startDate: formatDateInput(start),
      startTime: formatTimeInput(start),
      endDate: formatDateInput(end),
      endTime: formatTimeInput(end),

      publishingDate: formatDateInput(e?.publishingDate),
      publishingTime: formatTimeInput(e?.publishingDate),

      isPublic: visibility?.isPublic !== false,
      privateInviteEmails: Array.isArray(visibility?.inviteEmails)
        ? visibility.inviteEmails.join("\n")
        : "",

      minAgeEnabled: Boolean(extra?.minAgeEnabled),
      minAge: extra?.minAge ? String(extra.minAge) : "",
      checkInStartTime: extra?.checkInStartTime || "",
      parkingEnabled: Boolean(extra?.parkingEnabled),
      parkingType: extra?.parkingType || "FREE",
      parkingLotsText: extra?.parkingLots || "",

      isFree: Boolean(ticketing?.isFree),
      ticketsTotal: ticketing?.ticketsTotal
        ? String(ticketing.ticketsTotal)
        : "",
      limitPerPerson: ticketing?.limitPerPerson
        ? String(ticketing.limitPerPerson)
        : "",
      promoEnabled: Boolean(ticketing?.promoEnabled),
      promoEndDate: ticketing?.promoEndDate
        ? formatDateInput(ticketing.promoEndDate)
        : "",

      ticketCategories:
        Array.isArray(ticketing?.categories) && ticketing.categories.length
          ? ticketing.categories.map((c) => ({
              name: c.name || "",
              dateKey: c.dateKey || "PACK",
              price: c.price != null ? String(c.price) : "",
              quantity: c.quantity != null ? String(c.quantity) : "",
            }))
          : [buildDefaultCategory()],

      // NEW: program-linked events can auto-send tickets per investor category
      programAllocationEnabled: programAllocation?.enabled !== false,
      programAllocationRows: Array.isArray(programAllocation?.perCategory)
        ? programAllocation.perCategory.map((r) => ({
            categoryName: r?.categoryName || "",
            ticketsPerInvestor:
              r?.ticketsPerInvestor != null ? String(r.ticketsPerInvestor) : "",
          }))
        : [],

      agendaFileUrl: config?.agendaFileUrl || "",
    };
  });

  useEffect(() => {
    // If linked to a Program, it should be private and free.
    if (state.relatedProgramEventId) {
      setState((prev) => ({
        ...prev,
        isPublic: false,
        isFree: true,
      }));
    }
  }, [state.relatedProgramEventId]);

  return [state, setState];
}
