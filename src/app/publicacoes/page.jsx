import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";
import {
  Eye,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

async function fetchPosts(organizationId, status) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/posts?status=${status}`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching posts, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

async function approvePost(organizationId, postId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/posts/${encodeURIComponent(postId)}/approve`,
    { method: "POST" },
  );
  if (!response.ok) {
    throw new Error(
      `When approving post, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

function formatDate(dateStr) {
  if (!dateStr) return "–";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return "–";
  }
}

function PostCard({ post, isPending, organizationId, onApproved }) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => approvePost(organizationId, post.postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "dashboard"],
      });
      if (onApproved) onApproved();
    },
  });

  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {post.thumbnailUrl ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#F3F4F6] relative">
            <img
              src={post.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {post.streamUrl ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play size={20} className="text-white" />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-[#F3F4F6] flex-shrink-0 flex items-center justify-center">
            <div className="text-xs text-[#9CA3AF] font-inter">Sem img</div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold font-inter text-[#111827] line-clamp-1">
            {post.caption || "(sem título)"}
          </div>
          {post.subCaption ? (
            <div className="text-xs font-inter text-[#6B7280] mt-0.5 line-clamp-2">
              {post.subCaption}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <div className="text-[11px] font-inter text-[#9CA3AF]">
              {post.senderName || "Desconhecido"}
            </div>
            <div className="text-[11px] font-inter text-[#9CA3AF]">•</div>
            <div className="text-[11px] font-inter text-[#9CA3AF]">
              {formatDate(post.createdAt)}
            </div>
            {post.status === "APPROVED" ? (
              <div className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-inter text-emerald-700">
                Aprovada
              </div>
            ) : null}
            {post.status === "AWAITING_APPROVAL" ? (
              <div className="px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-[10px] font-inter text-orange-700">
                Aguardando
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 pt-1 border-t border-[#F3F4F6]">
          {post.streamUrl ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-xs font-inter hover:bg-[#F9FAFB] transition-colors"
            >
              <Eye size={14} />
              Visualizar
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-inter hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle size={14} />
            {approveMutation.isPending ? "Aprovando…" : "Aprovar"}
          </button>

          {approveMutation.isError ? (
            <div className="text-xs text-red-600 font-inter">
              Erro ao aprovar
            </div>
          ) : null}
        </div>
      ) : null}

      {previewOpen && post.streamUrl ? (
        <div className="mt-1 rounded-lg overflow-hidden bg-black">
          <video
            src={post.streamUrl}
            controls
            className="w-full max-h-[300px]"
            poster={post.thumbnailUrl || undefined}
          />
        </div>
      ) : null}
    </div>
  );
}

function GroupSection({ group, isPending, organizationId, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown size={18} className="text-[#6B7280]" />
          ) : (
            <ChevronRight size={18} className="text-[#6B7280]" />
          )}
          <div className="text-sm font-semibold font-inter text-[#111827]">
            {group.label}
          </div>
          <div className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[11px] font-inter text-[#6B7280]">
            {group.posts.length}
          </div>
        </div>
      </button>

      {open ? (
        <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3">
          {group.posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              isPending={isPending}
              organizationId={organizationId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PublicacoesPage() {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [tab, setTab] = useState("approved");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab === "pending" || urlTab === "approved") {
      setTab(urlTab);
    }
  }, []);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "org", organizationId, "posts", tab],
    queryFn: () => fetchPosts(organizationId, tab),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const groups = data?.groups || [];
  const total = data?.total || 0;

  const isPending = tab === "pending";

  const tabs = useMemo(
    () => [
      { id: "approved", label: "Publicações no app" },
      { id: "pending", label: "Publicações para avaliar" },
    ],
    [],
  );

  return (
    <AdminShell
      title="Publicações"
      subtitle="Gestão de postagens da ONG"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-600 font-inter">
              Não foi possível carregar as publicações.
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            const cls = active
              ? "bg-[#111827] text-white border-[#111827]"
              : "bg-white text-[#111827] border-[#E5E7EB]";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`h-9 px-4 rounded-full border text-sm font-inter ${cls}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="text-sm text-[#6B7280] font-inter">Carregando…</div>
        ) : null}

        {!isLoading && groups.length === 0 ? (
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-6">
            <div className="text-sm text-[#6B7280] font-inter">
              {isPending
                ? "Nenhuma publicação aguardando aprovação."
                : "Nenhuma publicação aprovada encontrada."}
            </div>
          </div>
        ) : null}

        {!isLoading && total > 0 ? (
          <div className="text-xs text-[#6B7280] font-inter">
            {total} publicação{total !== 1 ? "ões" : ""} encontrada
            {total !== 1 ? "s" : ""}
          </div>
        ) : null}

        <div className="space-y-4">
          {groups.map((group, idx) => (
            <GroupSection
              key={group.key}
              group={group}
              isPending={isPending}
              organizationId={organizationId}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
