export interface GalleryItem {
  id: string;
  semanticName: string;
  url: string;
  title: string;
  kannada: string;
  category: string;
  type: "image" | "video";
  featured: boolean;
  description: string;
}

import rawItems from "../../public/media/ashrama-curated-gallery.json";

export const CURATED_GALLERY: GalleryItem[] = rawItems as GalleryItem[];

export const GALLERY_CATEGORIES = [
  "All Moments",
  "Annadana & Meals",
  "Vidya & Education",
  "Birthdays & Celebrations",
  "Patriotic & National",
  "Festivals & Spiritual",
  "Yoga & Health",
  "Sports & Play",
  "Our 25 Boys",
  "Live Videos",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];
