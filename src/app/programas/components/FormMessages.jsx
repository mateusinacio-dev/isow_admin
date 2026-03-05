export function FormMessages({ error, success }) {
  if (!error && !success) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-white border border-red-200 rounded-xl p-4">
          <div className="text-sm text-red-600 font-inter whitespace-pre-line">
            {error}
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="bg-white border border-emerald-200 rounded-xl p-4">
          <div className="text-sm text-emerald-700 font-inter">{success}</div>
        </div>
      ) : null}
    </div>
  );
}
