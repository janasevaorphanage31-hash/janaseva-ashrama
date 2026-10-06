import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { FutureSection } from "@/components/sections/FutureSection";

import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Proposed Future Campus Project | Janaseva Ashrama Bangalore",
  description:
    "Learn about our proposed future children's home campus and educational facilities expansion for Janaseva Ashrama.",
};

export default function FuturePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Future Project" }]} />
      <PageHero eyebrow="Proposed future project" title="Our Future" lead="A proposed campus. Not an existing one." />
      <FutureSection standalone />
    </>
  );
}
