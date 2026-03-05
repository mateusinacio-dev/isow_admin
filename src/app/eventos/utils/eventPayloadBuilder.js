import { combineDateTime } from "./dateFormatters";
import { normalizeEmailList } from "./emailUtils";

export function buildEventPayload(state) {
  const startIso = combineDateTime(state.startDate, state.startTime);
  const endIso = combineDateTime(state.endDate, state.endTime);
  const publishingIso = state.publishingDate
    ? combineDateTime(state.publishingDate, state.publishingTime || "00:00")
    : null;

  const attendanceAddress = {
    placeName: state.placeName || null,
    street: state.street || null,
    number: state.streetNumber || null,
    city: state.city || null,
    state: state.stateCode || null,
  };

  const inviteEmails = normalizeEmailList(state.privateInviteEmails);

  const ticketCategories = (state.ticketCategories || [])
    .map((c) => ({
      name: String(c.name || "").trim(),
      dateKey: c.dateKey || "PACK",
      price: c.price === "" ? null : Number(c.price),
      quantity: c.quantity === "" ? null : Number(c.quantity),
    }))
    .filter((c) => Boolean(c.name));

  const programAllocationRows = Array.isArray(state.programAllocationRows)
    ? state.programAllocationRows
        .map((r) => ({
          categoryName: String(r?.categoryName || "").trim(),
          ticketsPerInvestor: Number(r?.ticketsPerInvestor || 0) || 0,
        }))
        .filter((r) => r.categoryName)
    : [];

  const adminConfig = {
    visibility: {
      isPublic: Boolean(state.isPublic),
      inviteEmails,
    },
    extra: {
      minAgeEnabled: Boolean(state.minAgeEnabled),
      minAge: state.minAgeEnabled ? Number(state.minAge || 0) : null,
      checkInStartTime: state.checkInStartTime || null,
      parkingEnabled: Boolean(state.parkingEnabled),
      parkingType: state.parkingEnabled ? state.parkingType || null : null,
      parkingLots: state.parkingEnabled ? state.parkingLotsText || null : null,
    },
    ticketing: {
      isFree: Boolean(state.isFree),
      ticketsTotal: state.isFree ? Number(state.ticketsTotal || 0) : null,
      limitPerPerson: state.limitPerPerson
        ? Number(state.limitPerPerson)
        : null,
      promoEnabled: Boolean(state.promoEnabled),
      promoEndDate: state.promoEnabled ? state.promoEndDate || null : null,
      categories: state.isFree ? [] : ticketCategories,

      // NEW
      programAllocation: state.relatedProgramEventId
        ? {
            enabled: state.programAllocationEnabled !== false,
            perCategory: programAllocationRows,
          }
        : null,
    },
    agendaFileUrl: state.agendaFileUrl || null,
  };

  return {
    name: String(state.name || "").trim(),
    startDate: startIso,
    endDate: endIso,
    shortDescription: state.shortDescription || null,
    longDescription: state.longDescription || null,
    attendanceType: "ONPREMISSES",
    attendanceAddress,
    publishingDate: publishingIso,
    logoImageUrl: state.logoImageUrl || null,
    coverImageUrl: state.coverImageUrl || null,
    relatedProgramEventId: state.relatedProgramEventId || null,
    adminConfig,
  };
}
