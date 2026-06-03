import { notFound } from "next/navigation";
import { getArchiveDetail } from "@/lib/archive";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { getTranslations } from "next-intl/server";

export default async function ClassicPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("classics");

  const detail = await getArchiveDetail(id);
  if (!detail) notFound();

  const backHref = `/${locale}`;
  const subtitle = [
    detail.director ? `${t("director")}: ${detail.director}` : null,
    detail.year > 0 ? String(detail.year) : null,
    t("publicDomain"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <VideoPlayer
      title={detail.title}
      subtitle={subtitle}
      videoUrl={detail.videoUrl}
      backdrop={detail.poster}
      backHref={backHref}
    />
  );
}
