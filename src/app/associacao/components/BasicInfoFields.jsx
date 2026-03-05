export function BasicInfoFields({
  form,
  setForm,
  fieldErrors,
  showValidation,
}) {
  const baseClass = "mt-1 w-full h-10 px-3 rounded-lg border";

  const legalNameError = showValidation ? fieldErrors?.legalName : null;
  const tradeNameError = showValidation ? fieldErrors?.tradeName : null;
  const legalIdNumberError = showValidation ? fieldErrors?.legalIdNumber : null;
  const emailError = showValidation ? fieldErrors?.email : null;
  const phoneError = showValidation ? fieldErrors?.phone : null;

  const legalNameClass = `${baseClass} ${
    legalNameError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const tradeNameClass = `${baseClass} ${
    tradeNameError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const legalIdNumberClass = `${baseClass} ${
    legalIdNumberError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const emailClass = `${baseClass} ${
    emailError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const phoneClass = `${baseClass} ${
    phoneError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const websiteClass = `${baseClass} border-[#E6E6E6]`;

  return (
    <>
      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Nome (Razão social) *</div>
        <input
          className={legalNameClass}
          value={form.legalName}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, legalName: e.target.value }))
          }
        />
        {legalNameError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {legalNameError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Nome fantasia *</div>
        <input
          className={tradeNameClass}
          value={form.tradeName}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, tradeName: e.target.value }))
          }
        />
        {tradeNameError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {tradeNameError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">CNPJ *</div>
        <input
          className={legalIdNumberClass}
          value={form.legalIdNumber}
          required
          onChange={(e) =>
            setForm((p) => ({ ...p, legalIdNumber: e.target.value }))
          }
        />
        {legalIdNumberError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {legalIdNumberError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">E-mail *</div>
        <input
          className={emailClass}
          value={form.email}
          required
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        {emailError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {emailError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Telefone *</div>
        <input
          className={phoneClass}
          value={form.phone}
          required
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        {phoneError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {phoneError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Site (opcional)</div>
        <input
          className={websiteClass}
          value={form.websiteUrl}
          onChange={(e) =>
            setForm((p) => ({ ...p, websiteUrl: e.target.value }))
          }
        />
      </label>
    </>
  );
}
