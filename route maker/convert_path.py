import json
import math
import sys


def distance(lat1, lon1, lat2, lon2):
    d_lat = lat1 - lat2
    d_lon = lon1 - lon2
    return math.sqrt(d_lat * d_lat + d_lon * d_lon)


def convert_to_path(data):
    named_points = [p for p in data["placemarks"] if p["type"] == "Point"]
    linestring = next(p for p in data["placemarks"]
                      if p["type"] == "LineString")
    coordinates = linestring["coordinates"]

    # For each named point, find the single closest path coordinate index
    name_map = {}
    for pt in named_points:
        min_dist = float("inf")
        closest_idx = -1
        for idx, coord in enumerate(coordinates):
            d = distance(
                coord["latitude"], coord["longitude"],
                pt["coordinates"]["latitude"], pt["coordinates"]["longitude"]
            )
            if d < min_dist:
                min_dist = d
                closest_idx = idx
        name_map[closest_idx] = pt["name"]

    # Build path: only the closest point per named placemark gets a name
    path = [
        {
            "index": idx,
            "name": name_map.get(idx, ""),
            "desc": "",
            "station": idx in name_map,
            "coordinates": {
                "longitude": coord["longitude"],
                "latitude": coord["latitude"],
                "altitude": coord.get("altitude", 0.0)
            }
        }
        for idx, coord in enumerate(coordinates)
    ]

    return {"path": path}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_path.py <input.json> [output.json]")
        sys.exit(1)

    input_file = sys.argv[1]
    base, ext = input_file.rsplit(
        ".", 1) if "." in input_file else (input_file, "json")
    output_file = f"{base}_output.{ext}"

    with open(input_file, "r") as f:
        input_data = json.load(f)

    result = convert_to_path(input_data)

    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Done! Saved to {output_file}")
