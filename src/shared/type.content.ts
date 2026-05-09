import z from "zod";

/** A single item in list.json */
export const ContentListItem = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  subcategory: z.string().nullable().optional(),
  heroImage: z
    .object({
      url: z.string(),
      alt: z.string(),
    })
    .nullable(),
  order: z.number(),
});
export type ContentListItem = z.infer<typeof ContentListItem>;

/** The entry.json for a single content entry */
export const ContentEntry = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  categoryDir: z.string(),
  subcategory: z.string().nullable().optional(),
  heroImage: z
    .object({
      url: z.string(),
      alt: z.string(),
    })
    .nullable(),
  updatedAt: z.string(),
});
export type ContentEntry = z.infer<typeof ContentEntry>;

/** A normalized entry in content/search-index.json for fast client-side search */
export const ContentSearchIndexEntry = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  subcategory: z.string().nullable().optional(),
  heroImage: z
    .object({
      url: z.string(),
      alt: z.string(),
    })
    .nullable(),
  contentText: z.string().optional(),
  order: z.number(),
});
export type ContentSearchIndexEntry = z.infer<typeof ContentSearchIndexEntry>;

/** Single category in categories.json */
export const ContentCategory = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  count: z.number(),
});
export type ContentCategory = z.infer<typeof ContentCategory>;
