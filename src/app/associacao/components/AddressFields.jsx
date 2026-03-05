export function AddressFields({ form, setForm, fieldErrors, showValidation }) {
  const baseClass = "mt-1 w-full h-10 px-3 rounded-lg border";

  const addressStreetError = showValidation ? fieldErrors?.addressStreet : null;
  const addressNumberError = showValidation ? fieldErrors?.addressNumber : null;
  const addressNeighborhoodError = showValidation
    ? fieldErrors?.addressNeighborhood
    : null;
  const addressPostalCodeError = showValidation
    ? fieldErrors?.addressPostalCode
    : null;
  const addressCityError = showValidation ? fieldErrors?.addressCity : null;
  const addressStateError = showValidation ? fieldErrors?.addressState : null;

  const addressStreetClass = `${baseClass} ${
    addressStreetError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const addressNumberClass = `${baseClass} ${
    addressNumberError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const addressComplimentClass = `${baseClass} border-[#E6E6E6]`;

  const addressNeighborhoodClass = `${baseClass} ${
    addressNeighborhoodError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const addressPostalCodeClass = `${baseClass} ${
    addressPostalCodeError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const addressCityClass = `${baseClass} ${
    addressCityError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const addressStateClass = `${baseClass} ${
    addressStateError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  return (
    <>
      <div className="md:col-span-2">
        <div className="text-sm font-semibold font-inter text-[#111827] mt-2">
          Endereço da sede
        </div>
      </div>

      <label className="text-sm font-inter md:col-span-2">
        <div className="text-xs text-[#6B7280]">Rua *</div>
        <input
          className={addressStreetClass}
          value={form.addressStreet}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, addressStreet: e.target.value }))
          }
        />
        {addressStreetError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {addressStreetError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Número *</div>
        <input
          className={addressNumberClass}
          value={form.addressNumber}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, addressNumber: e.target.value }))
          }
        />
        {addressNumberError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {addressNumberError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Complemento (opcional)</div>
        <input
          className={addressComplimentClass}
          value={form.addressCompliment}
          onChange={(e) =>
            setForm((p) => ({ ...p, addressCompliment: e.target.value }))
          }
        />
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Bairro *</div>
        <input
          className={addressNeighborhoodClass}
          value={form.addressNeighborhood}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, addressNeighborhood: e.target.value }))
          }
        />
        {addressNeighborhoodError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {addressNeighborhoodError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">CEP *</div>
        <input
          className={addressPostalCodeClass}
          value={form.addressPostalCode}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, addressPostalCode: e.target.value }))
          }
        />
        {addressPostalCodeError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {addressPostalCodeError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Cidade *</div>
        <input
          className={addressCityClass}
          value={form.addressCity}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, addressCity: e.target.value }))
          }
        />
        {addressCityError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {addressCityError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Estado (UF) *</div>
        <input
          className={addressStateClass}
          value={form.addressState}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, addressState: e.target.value }))
          }
        />
        {addressStateError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {addressStateError}
          </div>
        ) : null}
      </label>
    </>
  );
}
