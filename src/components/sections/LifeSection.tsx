import { Container, Head, Section } from "../ui";

const LIFE = [
  { t: "A Day Here", d: "Wake-up, school, play, dinner, stories - the rhythm of an ordinary, happy day.", img: "/media/play.jpg" },
  { t: "Education", d: "Homework help, reading and learning support for every age.", img: "/media/education.jpg" },
  { t: "Nutrition", d: "Meals prepared and shared as part of everyday life.", img: "/media/food.jpg" },
  { t: "Healthcare", d: "Health and wellbeing support as part of everyday care.", img: "/media/health.jpg" },
  { t: "Skills", d: "Learning and skill-building opportunities for the future.", img: "/media/learning.jpg" },
  { t: "Activities", d: "Sports, music, art, gardening and festivals.", img: "/media/garden.jpg" },
  { t: "Community", d: "Neighbours, volunteers and friends who make the home bigger.", img: "/media/community.jpg" },
];

export function LifeSection() {
  return (
    <Section id="life" tone="cream">
      <Container>
        <Head
          eyebrow="Life at Janaseva"
          title="Childhood with dignity"
          lead="Here, children are learners, dreamers, teammates and friends. Your support protects these everyday moments of growing up well."
        />
      </Container>
      <div className="mx-auto max-w-6xl w-full max-w-full overflow-hidden">
        <div className="swipe md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-5 lg:grid-cols-4 w-full max-w-full">
          {LIFE.map((l) => (
            <article key={l.t} className="group relative aspect-[3/4] w-[68vw] max-w-[280px] overflow-hidden rounded-3xl bg-teal-900 md:w-auto md:max-w-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.img} alt={`${l.t} at Janaseva Ashrama`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-teal-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="font-display text-xl font-bold">{l.t}</h3>
                <p className="mt-1 text-sm text-white/80">{l.d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
