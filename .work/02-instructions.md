# Instructions

As you fully complete the top level steps, check the boxes in this file. Do not make any other updates to this file.
All updates mentioned in the steps below should be made in the `.work/02-features.md` file.
Complete the work fully and completely.
Ask me questions if you are confused or if you have doubts.
If you encounter any issues with the mcp server, if you needed to ask me any questions, if you had any confusions about the content, if you were confused by the instructions in any way, add a bullet point to the `.work/02-lessons-learned.md` file so that you can remember that for next time.

# Steps

- [x] Review all the steps, ask me any questions you need for clarifications, and any additional infor or clarifications to the lessons leared.
- [x] Use the contentful mcp to list out all entries with content type = ruleReference and category one of: class or race.
- [x] For each entry, pull the details one at a time and then do the following sub steps:
    - Add either a `## Race: <race_name> Features` or `## Class <class_name> Features` section to this file in either the `# Races` section or the `# Classes` section.
    - Add either `Race ID: <the_race_id>` or `Class ID: <the_class_id>` below the `##` heading.
    - Add all of the features from that entry to that section in `### <race_name> Feature: <feature_name>` or `### <class_name> Feature: <feature_name>` sub sections.
- [ ] Once completed for all entries. Review all of the features for duplicate names.
    - For each duplicate name, ask me to resolve it by choosing a new name for each feature
    - Update the `###` heading in the file with the new name
    - Add the name changes to the `# Updates to make in the rulebook` section.
    - Update the class or race entry in contentful
- [ ] Once all duplicates are resolved, create entries in contentful with content type = ruleReference and category = feature for all of the features for all of the races and classes.
    - The `title` of the features should be the name of the feature.
    - The `category` field should be `feature`
    - The `subcategory` field should be `<race_or_class_name> Feature`
    - The `content` field should be the description and details of the feature as-is without modification.
    - The `ruleReference` field should link back to the race or class
    - The `order` field should be 1, 2, 3, etc. based on the order that the features appear in the race or class entry.
