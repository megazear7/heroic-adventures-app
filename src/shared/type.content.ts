import z from "zod";

/** A single item in list.json */
export const ContentListItem = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  heroImage: z
    .object({
      url: z.string(),
      alt: z.string(),
    })
    .nullable(),
});
export type ContentListItem = z.infer<typeof ContentListItem>;

/** The entry.json for a single content entry */
export const ContentEntry = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  categoryDir: z.string(),
  heroImage: z
    .object({
      url: z.string(),
      alt: z.string(),
    })
    .nullable(),
  updatedAt: z.string(),
});
export type ContentEntry = z.infer<typeof ContentEntry>;

/** Single category in categories.json */
export const ContentCategory = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  count: z.number(),
});
export type ContentCategory = z.infer<typeof ContentCategory>;
