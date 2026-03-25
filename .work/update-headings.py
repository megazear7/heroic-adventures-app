"""Parse Contentful MCP XML output, modify heading-3 text, and output JSON for update."""
import xml.etree.ElementTree as ET
import json
import sys


def parse_richtext_node(elem):
    """Convert an XML rich text node to JSON."""
    node = {}
    node_type = elem.find("nodeType")
    if node_type is not None:
        node["nodeType"] = node_type.text

    # Check for value (text nodes)
    value = elem.find("value")
    if value is not None:
        node["value"] = value.text or ""

    # Check for marks (text nodes)
    if node.get("nodeType") == "text":
        marks = []
        for mark_elem in elem.findall("marks"):
            mark_type = mark_elem.find("type")
            if mark_type is not None:
                marks.append({"type": mark_type.text})
        node["marks"] = marks

    # data is always {}
    node["data"] = {}

    # Recurse into content children
    content_children = elem.findall("content")
    if content_children:
        node["content"] = [parse_richtext_node(c) for c in content_children]

    return node


def extract_richtext_json(xml_file):
    """Extract the rich text document JSON from a Contentful MCP XML output file."""
    with open(xml_file, "r") as f:
        raw = f.read()

    # Strip the "Entry retrieved successfully:" prefix
    xml_start = raw.index("<entry>")
    xml_str = raw[xml_start:]

    # Remove invalid XML elements like <*> and </*>
    import re
    xml_str = re.sub(r'<fieldStatus>.*?</fieldStatus>', '', xml_str, flags=re.DOTALL)
    xml_str = re.sub(r'<\*>.*?</\*>', '', xml_str, flags=re.DOTALL)

    root = ET.fromstring(xml_str)
    fields = root.find("fields")
    content_field = fields.find("content")
    en_us = content_field.find("en-US")

    return parse_richtext_node(en_us)


def modify_heading(doc, old_text, new_text):
    """Find and replace heading-3 text in a rich text document."""
    if "content" not in doc:
        return False
    for node in doc["content"]:
        if node.get("nodeType") == "heading-3":
            for child in node.get("content", []):
                if child.get("nodeType") == "text" and child.get("value") == old_text:
                    child["value"] = new_text
                    return True
        if modify_heading(node, old_text, new_text):
            return True
    return False


def process_entry(xml_file, replacements):
    """Process an entry XML file and apply heading replacements."""
    doc = extract_richtext_json(xml_file)
    for old_text, new_text in replacements:
        found = modify_heading(doc, old_text, new_text)
        if found:
            print(f"  Replaced: '{old_text}' -> '{new_text}'", file=sys.stderr)
        else:
            print(f"  WARNING: '{old_text}' not found!", file=sys.stderr)
    return doc


if __name__ == "__main__":
    base = "/Users/alexlockhart/Library/Application Support/Code/User/workspaceStorage/6d422cf269e94fea5a2b0d367197d160/GitHub.copilot-chat/chat-session-resources/cd21828a-61f7-4f11-acdf-f5efcbf6f193"

    entries = {
        "cleric": {
            "file": f"{base}/toolu_vrtx_019Mc3ji98mWLvjuLraa3bgB__vscode-1774260400047/content.txt",
            "replacements": [
                ("Sacrifice: Minor Action", "Sacrifice (Cleric): Minor Action"),
            ],
        },
        "paladin": {
            "file": "/tmp/paladin_entry.xml",
            "replacements": [
                ("Sacrifice: Heroic Action", "Sacrifice (Paladin): Heroic Action"),
            ],
        },
        "dwarf": {
            "file": f"{base}/toolu_vrtx_01FuFaD7VZRWtV5X9ayKjzZs__vscode-1774260400048/content.txt",
            "replacements": [
                ("Rune Lore: Feature", "Rune Lore (Dwarf): Feature"),
                ("Rune Power: Feature", "Rune Power (Dwarf): Feature"),
            ],
        },
        "gnome": {
            "file": f"{base}/toolu_vrtx_01MmF2CbkDr1JBMPkYPsUVW2__vscode-1774260400049/content.txt",
            "replacements": [
                ("Rune Lore: Feature", "Rune Lore (Gnome): Feature"),
                ("Rune Power: Feature", "Rune Power (Gnome): Feature"),
            ],
        },
    }

    results = {}
    for name, config in entries.items():
        print(f"Processing {name}...", file=sys.stderr)
        doc = process_entry(config["file"], config["replacements"])
        results[name] = doc

    # Output all as a single JSON
    json.dump(results, sys.stdout, indent=2)
