import Link from "next/link";
import Image from "next/image";
import { Chip, Container, Head, Section } from "../ui";

type Update = {
  id: number;
  title: string;
  body: string;
  category: string;
  imageUrl: string | null;
  isSample: boolean;
  publishedAt: Date;
};

export function TodaySection({
  updates,
  standalone = false,
}: {
  updates: Update[];
  standalone?: boolean;
}) {
  const featured = updates[0];
  const rest = updates.slice(1, 7);

  return (
    <Section id="today" tone="cream" className="py-10 md:py-16">
      <Container>
        <Head
          eyebrow="Real Daily Moments"
          title="Today at Janaseva"
          lead="Fresh meals prepared before dawn. Quiet study tables in the evening. Joyful laughter in the courtyard. See real moments from the Ashrama today."
        />

        {updates.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-teal-900/70">
            Today&apos;s updates are being published by the Ashrama team. Please check back shortly.
          </p>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Primary Editorial Lead Story (Section 8 Layout) */}
            {featured && (
              <article className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-md ring-1 ring-teal-900/10 grid lg:grid-cols-[1.1fr_0.9fr] transition hover:shadow-lg">
                {/* Large Visual */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[220px] sm:min-h-[280px] bg-teal-900 overflow-hidden">
                  <Image
                    src={featured.imageUrl || "/media/poster.jpg"}
                    alt={`${featured.category}: ${featured.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 650px"
                    unoptimized={Boolean(featured.imageUrl?.startsWith("data:"))}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent lg:hidden" />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <Chip tone="orange">{featured.category}</Chip>
                  </div>
                </div>

                {/* Editorial Story Text */}
                <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-teal-900/50 mb-1.5 sm:mb-2">
                      <span className="uppercase tracking-wider">Featured Daily Moment</span>
                      <time dateTime={new Date(featured.publishedAt).toISOString()}>
                        {new Date(featured.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    <h3 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-teal-900 leading-tight">
                      {featured.title}
                    </h3>

                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-base leading-relaxed text-teal-950/75">
                      {featured.body}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-teal-900/10 flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link
                      href="/stories"
                      className="focus-ring rounded-xl bg-teal-900 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-teal-800 shadow-xs"
                    >
                      SEE THE STORY →
                    </Link>
                    <Link
                      href="/impact"
                      className="focus-ring rounded-xl bg-saffron px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-saffron-dark shadow-xs"
                    >
                      SUPPORT THIS NEED
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Editorial Secondary Moments Grid: 2-in-a-row on mobile! */}
            {rest.length > 0 && (
              <div className="w-full max-w-full">
                <div className="mb-3 sm:mb-4 flex items-center justify-between">
                  <h4 className="font-display text-sm sm:text-lg font-bold text-teal-900">
                    More Moments from the Ashrama
                  </h4>
                  <Link href="/today" className="text-xs font-bold text-saffron-dark hover:underline">
                    View all updates ({updates.length}) →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 w-full">
                  {rest.map((u) => (
                    <article
                      key={u.id}
                      className="overflow-hidden rounded-2xl bg-white shadow-2xs ring-1 ring-teal-900/10 transition hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-teal-100 overflow-hidden">
                          {u.imageUrl ? (
                            <Image
                              src={u.imageUrl}
                              alt={`${u.category}: ${u.title}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 300px, 400px"
                              unoptimized={Boolean(u.imageUrl?.startsWith("data:"))}
                            />
                          ) : (
                            <Image
                              src="/media/learning.jpg"
                              alt={`${u.category}: ${u.title}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, 300px"
                            />
                          )}
                          <span className="absolute left-2 top-2 sm:left-3 sm:top-3">
                            <span className="rounded-md bg-teal-950/85 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs truncate max-w-[85px]">
                              {u.category}
                            </span>
                          </span>
                        </div>
                        <div className="p-2.5 sm:p-4">
                          <time
                            dateTime={new Date(u.publishedAt).toISOString()}
                            className="block text-[9px] sm:text-[11px] font-semibold text-teal-900/50 mb-0.5 sm:mb-1"
                          >
                            {new Date(u.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </time>
                          <h4 className="font-display text-xs sm:text-base font-bold text-teal-900 leading-snug line-clamp-2">
                            {u.title}
                          </h4>
                          <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-teal-950/70 line-clamp-2">
                            {u.body}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-4 pt-0">
                        <Link
                          href="/stories"
                          className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-saffron-dark hover:underline"
                        >
                          Details →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}
