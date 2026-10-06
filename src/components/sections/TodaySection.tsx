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
    <Section id="today" tone="cream" className="py-12 md:py-16">
      <Container>
        <Head
          eyebrow="Real Daily Moments"
          title="Today at Janaseva"
          lead="Fresh meals prepared before dawn. Quiet study tables in the evening. Joyful laughter in the courtyard. See what your support sustains today."
        />

        {updates.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-teal-900/70">
            Today&apos;s updates are being published by the Ashrama team. Please check back shortly.
          </p>
        ) : (
          <div className="space-y-8">
            {/* Primary Editorial Lead Story (Section 8 Layout) */}
            {featured && (
              <article className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-teal-900/10 grid lg:grid-cols-[1.1fr_0.9fr] transition hover:shadow-lg">
                {/* Large Visual */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[280px] bg-teal-900">
                  <Image
                    src={featured.imageUrl || "/media/poster.jpg"}
                    alt={`${featured.category}: ${featured.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 650px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent lg:hidden" />
                  <div className="absolute top-4 left-4">
                    <Chip tone="orange">{featured.category}</Chip>
                  </div>
                </div>

                {/* Editorial Story Text */}
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-teal-900/50 mb-2">
                      <span className="uppercase tracking-wider">Featured Daily Journal</span>
                      <time dateTime={featured.publishedAt.toISOString()}>
                        {featured.publishedAt.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-teal-900 leading-tight">
                      {featured.title}
                    </h3>

                    <p className="mt-3 text-sm sm:text-base leading-relaxed text-teal-950/75">
                      {featured.body}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-5 border-t border-teal-900/10 flex flex-wrap items-center gap-3">
                    <Link
                      href="/stories"
                      className="focus-ring rounded-xl bg-teal-900 px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-teal-800 shadow"
                    >
                      SEE THE STORY →
                    </Link>
                    <Link
                      href="/impact"
                      className="focus-ring rounded-xl bg-saffron px-5 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-saffron-dark shadow"
                    >
                      SUPPORT THIS NEED
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Editorial Secondary Moments Reel */}
            {rest.length > 0 && (
              <div className="w-full max-w-full overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-display text-lg font-bold text-teal-900">
                    More Moments from the Ashrama
                  </h4>
                  <Link href="/today" className="text-xs font-bold text-saffron-dark hover:underline">
                    View all updates ({updates.length}) →
                  </Link>
                </div>

                <div className="swipe md:grid md:grid-cols-3 md:gap-5 md:overflow-visible w-full max-w-full">
                  {rest.map((u) => (
                    <article
                      key={u.id}
                      className="w-[78vw] max-w-[320px] shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-teal-900/10 transition hover:shadow-md md:w-auto md:max-w-none flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-teal-100">
                          {u.imageUrl && (
                            <Image
                              src={u.imageUrl}
                              alt={`${u.category}: ${u.title}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 300px, 400px"
                            />
                          )}
                          <span className="absolute left-3 top-3">
                            <Chip tone="plain">{u.category}</Chip>
                          </span>
                        </div>
                        <div className="p-4">
                          <time
                            dateTime={u.publishedAt.toISOString()}
                            className="block text-[11px] font-semibold text-teal-900/50 mb-1"
                          >
                            {u.publishedAt.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </time>
                          <h4 className="font-display text-lg font-bold text-teal-900 leading-snug">
                            {u.title}
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-teal-950/70 line-clamp-2">
                            {u.body}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <Link
                          href="/stories"
                          className="inline-flex items-center gap-1 text-xs font-bold text-saffron-dark hover:underline"
                        >
                          See full story →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-teal-900/10 pt-6">
          <Link
            href="/impact"
            className="focus-ring rounded-xl bg-saffron px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:bg-saffron-dark active:scale-95"
          >
            MAKE AN IMPACT ON TODAY&apos;S NEEDS →
          </Link>
          {!standalone && (
            <Link
              href="/stories"
              className="text-xs font-bold text-teal-900 hover:text-teal-950 underline underline-offset-4"
            >
              Explore our full documentary journal →
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
