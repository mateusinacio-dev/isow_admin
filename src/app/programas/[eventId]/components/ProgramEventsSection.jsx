import { formatDate } from "@/utils/formatters";

export function ProgramEventsSection({
  eventId,
  programEventsFuture,
  programEventsPast,
}) {
  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
        Eventos do programa
      </div>
      <div className="text-xs text-[#6B7280] font-inter mb-4">
        Lista ONPREMISE relacionada ao programa (mesma organização e, quando
        existir, mesmo projeto).
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
            Eventos futuros
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Nome
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Data
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Local
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Tickets
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Tickets enviados
                  </th>
                </tr>
              </thead>
              <tbody>
                {programEventsFuture.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 text-sm font-inter text-[#6B7280]"
                    >
                      Nenhum evento futuro encontrado.
                    </td>
                  </tr>
                ) : null}

                {programEventsFuture.map((e) => {
                  const link = e.ticketsSent
                    ? `/programas/${eventId}/eventos/${e.eventId}`
                    : null;
                  const nameCell = link ? (
                    <a
                      href={link}
                      className="font-semibold hover:underline"
                      title="Ver relação de investidores"
                    >
                      {e.name || "(sem nome)"}
                    </a>
                  ) : (
                    <span className="font-semibold">
                      {e.name || "(sem nome)"}
                    </span>
                  );

                  return (
                    <tr key={e.eventId} className="border-t border-[#F3F4F6]">
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {nameCell}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(e.startDate)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {e.locationLabel}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {e.ticketsTotal}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {e.ticketsSent ? "Sim" : "Não"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
            Eventos passados
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Nome
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Data
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Local
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Tickets
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Inscritos
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Presentes
                  </th>
                </tr>
              </thead>
              <tbody>
                {programEventsPast.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 text-sm font-inter text-[#6B7280]"
                    >
                      Nenhum evento passado encontrado.
                    </td>
                  </tr>
                ) : null}

                {programEventsPast.map((e) => {
                  const link = e.ticketsSent
                    ? `/programas/${eventId}/eventos/${e.eventId}`
                    : null;
                  const nameCell = link ? (
                    <a
                      href={link}
                      className="font-semibold hover:underline"
                      title="Ver relação de investidores"
                    >
                      {e.name || "(sem nome)"}
                    </a>
                  ) : (
                    <span className="font-semibold">
                      {e.name || "(sem nome)"}
                    </span>
                  );

                  return (
                    <tr key={e.eventId} className="border-t border-[#F3F4F6]">
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {nameCell}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(e.startDate)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {e.locationLabel}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {e.ticketsTotal}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {e.inscritos}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {e.presentes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
