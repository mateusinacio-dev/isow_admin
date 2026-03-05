export function MessageBanner({ error, success }) {
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-4">
        <div className="text-sm text-red-700 font-inter">{error}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white border border-emerald-200 rounded-xl p-4">
        <div className="text-sm text-emerald-800 font-inter">{success}</div>
      </div>
    );
  }

  return null;
}
