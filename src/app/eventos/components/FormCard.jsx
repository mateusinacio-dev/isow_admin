export function Card({ title, children }) {
  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="text-lg font-semibold font-inter text-[#111827] mb-4">
        {title}
      </div>
      {children}
    </div>
  );
}
