export function RepresentativeFields({
  form,
  setForm,
  fieldErrors,
  showValidation,
}) {
  const baseClass = "mt-1 w-full h-10 px-3 rounded-lg border";

  const repNameError = showValidation ? fieldErrors?.repName : null;
  const repEmailError = showValidation ? fieldErrors?.repEmail : null;
  const repPhoneError = showValidation ? fieldErrors?.repPhone : null;

  const repNameClass = `${baseClass} ${
    repNameError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const repEmailClass = `${baseClass} ${
    repEmailError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const repPhoneClass = `${baseClass} ${
    repPhoneError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const adminsClass =
    "mt-2 w-full min-h-[90px] p-3 rounded-lg border border-[#E6E6E6]";

  return (
    <>
      <div className="md:col-span-2">
        <div className="text-sm font-semibold font-inter text-[#111827] mt-2">
          Representante legal
        </div>
      </div>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Nome *</div>
        <input
          className={repNameClass}
          value={form.repName}
          required
          onChange={(e) => setForm((p) => ({ ...p, repName: e.target.value }))}
        />
        {repNameError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {repNameError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">E-mail *</div>
        <input
          className={repEmailClass}
          value={form.repEmail}
          required
          onChange={(e) => setForm((p) => ({ ...p, repEmail: e.target.value }))}
        />
        {repEmailError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {repEmailError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter md:col-span-2">
        <div className="text-xs text-[#6B7280]">Telefone *</div>
        <input
          className={repPhoneClass}
          value={form.repPhone}
          required
          onChange={(e) => setForm((p) => ({ ...p, repPhone: e.target.value }))}
        />
        {repPhoneError ? (
          <div className="text-[11px] font-inter text-red-600 mt-1">
            {repPhoneError}
          </div>
        ) : null}
      </label>

      <label className="text-sm font-inter md:col-span-2">
        <div className="text-xs text-[#6B7280]">
          Administradores da conta (1 por linha)
        </div>
        <div className="text-[11px] text-[#6B7280] font-inter mt-1">
          Dica: se você colocar e-mails aqui, essas pessoas ganham acesso à ONG
          quando entrarem na iSOW com a mesma conta.
        </div>
        <textarea
          className={adminsClass}
          value={form.adminsText}
          onChange={(e) =>
            setForm((p) => ({ ...p, adminsText: e.target.value }))
          }
        />
      </label>
    </>
  );
}
