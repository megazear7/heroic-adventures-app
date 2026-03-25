# Lessons learned

- Feature names in the heading-3 values have a format like "Tooth and claw: Heroic action". The feature name is only the part before the colon (e.g. "Tooth and claw"), not the full heading-3 text.
- The content to include under each feature `###` heading in the markdown file is the description paragraphs that follow the heading-3 in the Contentful entry.
- Duplicate feature name detection should be done across all races and classes combined, not separately.
- The `ruleReferences` field on the content type is an array. When linking back to the parent race/class, use an array with a single entry link.
- The heading-3 title should be included in the rich text `content` field when creating the feature entry in Contentful.
- The `order` field is per race/class (each race/class starts at 1), not global across all features.
