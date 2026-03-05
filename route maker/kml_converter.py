#!/usr/bin/env python3
"""
KML / KMZ to JSON converter
Usage:
    python kml_to_json.py input.kml
    python kml_to_json.py input.kmz
    python kml_to_json.py input.kml -o output.json
"""

import argparse
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

KML_NS = "{http://www.opengis.net/kml/2.2}"
ALT_NS = "{http://earth.google.com/kml/2.1}"  # older KML namespace


def find_tag(element, tag, ns):
    """Try finding a tag with given namespace, fallback to no namespace."""
    result = element.find(f"{ns}{tag}")
    if result is None:
        result = element.find(tag)
    return result


def find_all_tags(element, tag, ns):
    """Try finding all tags with given namespace, fallback to no namespace."""
    results = element.findall(f"{ns}{tag}")
    if not results:
        results = element.findall(tag)
    return results


def parse_coordinates(coord_str):
    """Parse a KML coordinate string into a list of dicts."""
    points = []
    for token in coord_str.strip().split():
        parts = token.split(",")
        if len(parts) >= 2:
            try:
                point = {
                    "longitude": float(parts[0]),
                    "latitude": float(parts[1]),
                    "altitude": float(parts[2]) if len(parts) > 2 else 0.0,
                }
                points.append(point)
            except ValueError:
                continue
    return points


def parse_placemark(pm, ns):
    """Convert a single <Placemark> element into a dict."""
    entry = {}

    name_el = find_tag(pm, "name", ns)
    if name_el is not None and name_el.text:
        entry["name"] = name_el.text.strip()

    desc_el = find_tag(pm, "description", ns)
    if desc_el is not None and desc_el.text:
        entry["description"] = desc_el.text.strip()

    style_el = pm.find("styleUrl")
    if style_el is None:
        style_el = pm.find(f"{ns}styleUrl")
    if style_el is not None and style_el.text:
        entry["styleUrl"] = style_el.text.strip()

    # --- Point ---
    point = find_tag(pm, "Point", ns)
    if point is not None:
        coords_el = find_tag(point, "coordinates", ns)
        if coords_el is not None and coords_el.text:
            pts = parse_coordinates(coords_el.text)
            entry["type"] = "Point"
            entry["coordinates"] = pts[0] if pts else {}
        return entry

    # --- LineString ---
    linestring = find_tag(pm, "LineString", ns)
    if linestring is not None:
        coords_el = find_tag(linestring, "coordinates", ns)
        if coords_el is not None and coords_el.text:
            entry["type"] = "LineString"
            entry["coordinates"] = parse_coordinates(coords_el.text)
        return entry

    # --- Polygon ---
    polygon = find_tag(pm, "Polygon", ns)
    if polygon is not None:
        entry["type"] = "Polygon"
        entry["rings"] = {}
        outer = find_tag(polygon, "outerBoundaryIs", ns)
        if outer is not None:
            lr = find_tag(outer, "LinearRing", ns)
            if lr is not None:
                coords_el = find_tag(lr, "coordinates", ns)
                if coords_el is not None:
                    entry["rings"]["outer"] = parse_coordinates(coords_el.text)
        inner_rings = []
        for inner in find_all_tags(polygon, "innerBoundaryIs", ns):
            lr = find_tag(inner, "LinearRing", ns)
            if lr is not None:
                coords_el = find_tag(lr, "coordinates", ns)
                if coords_el is not None:
                    inner_rings.append(parse_coordinates(coords_el.text))
        if inner_rings:
            entry["rings"]["inner"] = inner_rings
        return entry

    # --- MultiGeometry ---
    multi = find_tag(pm, "MultiGeometry", ns)
    if multi is not None:
        entry["type"] = "MultiGeometry"
        entry["geometries"] = []
        for child in multi:
            tag = child.tag.replace(ns, "").replace(ALT_NS, "")
            geom = {"type": tag}
            coords_el = find_tag(child, "coordinates", ns)
            if coords_el is not None and coords_el.text:
                pts = parse_coordinates(coords_el.text)
                geom["coordinates"] = pts[0] if tag == "Point" else pts
            entry["geometries"].append(geom)
        return entry

    entry["type"] = "Unknown"
    return entry


def parse_folder(folder_el, ns):
    """Recursively parse a <Folder> or <Document> element."""
    result = {}

    name_el = find_tag(folder_el, "name", ns)
    if name_el is not None and name_el.text:
        result["name"] = name_el.text.strip()

    desc_el = find_tag(folder_el, "description", ns)
    if desc_el is not None and desc_el.text:
        result["description"] = desc_el.text.strip()

    placemarks = []
    for pm in find_all_tags(folder_el, "Placemark", ns):
        placemarks.append(parse_placemark(pm, ns))
    if placemarks:
        result["placemarks"] = placemarks

    subfolders = []
    for folder in find_all_tags(folder_el, "Folder", ns):
        subfolders.append(parse_folder(folder, ns))
    if subfolders:
        result["folders"] = subfolders

    return result


def kml_string_to_json(kml_text):
    """Parse a KML string and return a Python dict."""
    root = ET.fromstring(kml_text)

    # Detect namespace
    ns = KML_NS
    if ALT_NS in root.tag:
        ns = ALT_NS

    # Find Document or use root directly
    doc = find_tag(root, "Document", ns)
    if doc is None:
        doc = root

    output = parse_folder(doc, ns)
    return output


def convert(input_path, output_path=None, indent=2):
    """Convert a KML or KMZ file to JSON."""
    input_path = Path(input_path)

    if not input_path.exists():
        print(f"Error: File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    suffix = input_path.suffix.lower()

    # Read KML content
    if suffix == ".kmz":
        with zipfile.ZipFile(input_path, "r") as zf:
            # Find the main KML file (usually doc.kml)
            kml_names = [n for n in zf.namelist() if n.endswith(".kml")]
            if not kml_names:
                print("Error: No .kml file found inside KMZ archive.", file=sys.stderr)
                sys.exit(1)
            # Prefer doc.kml, otherwise take the first one
            main_kml = next((n for n in kml_names if n.endswith("doc.kml")), kml_names[0])
            kml_text = zf.read(main_kml).decode("utf-8")
    elif suffix == ".kml":
        kml_text = input_path.read_text(encoding="utf-8")
    else:
        print(f"Error: Unsupported file type '{suffix}'. Expected .kml or .kmz", file=sys.stderr)
        sys.exit(1)

    data = kml_string_to_json(kml_text)
    json_str = json.dumps(data, indent=indent, ensure_ascii=False)

    # Determine output path
    if output_path is None:
        output_path = input_path.with_suffix(".json")

    Path(output_path).write_text(json_str, encoding="utf-8")
    print(f"Converted: {input_path} -> {output_path}")
    return data


def main():
    parser = argparse.ArgumentParser(
        description="Convert KML or KMZ files to JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python kml_to_json.py route.kml
  python kml_to_json.py map.kmz
  python kml_to_json.py route.kml -o my_output.json
  python kml_to_json.py route.kml --indent 4
        """,
    )
    parser.add_argument("input", help="Path to input .kml or .kmz file")
    parser.add_argument("-o", "--output", help="Path to output .json file (default: same name as input)")
    parser.add_argument("--indent", type=int, default=2, help="JSON indentation level (default: 2)")
    parser.add_argument("--print", action="store_true", help="Also print JSON to stdout")

    args = parser.parse_args()
    data = convert(args.input, args.output, args.indent)

    if args.print:
        print(json.dumps(data, indent=args.indent, ensure_ascii=False))


if __name__ == "__main__":
    main()