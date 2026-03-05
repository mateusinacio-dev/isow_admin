export function FormMessages({ error, success }) {
  return (
    <>
      {error ? (
        <div className="bg-white border border-red-200 rounded-xl p-4">
          <div className="text-sm text-red-600 font-inter">{error}</div>
        </div>
      ) : null}
      {success ? (
        <div className="bg-white border border-emerald-200 rounded-xl p-4">
          <div className="text-sm text-emerald-700 font-inter">{success}</div>
        </div>
      ) : null}
    </>
  );
}
