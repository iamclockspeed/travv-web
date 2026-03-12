import json
import math
import sys


def distance(lat1, lon1, lat2, lon2):
    d_lat = lat1 - lat2
    d_lon = lon1 - lon2
    return math.sqrt(d_lat * d_lat + d_lon * d_lon)


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance in kilometres between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * \
        math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def path_distance_km(coordinates, from_idx, to_idx):
    """Sum of haversine segments along the path from from_idx to to_idx."""
    total = 0.0
    for i in range(from_idx, to_idx):
        c1, c2 = coordinates[i], coordinates[i + 1]
        total += haversine_km(
            c1["latitude"], c1["longitude"],
            c2["latitude"], c2["longitude"],
        )
    return total


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
                pt["coordinates"]["latitude"], pt["coordinates"]["longitude"],
            )
            if d < min_dist:
                min_dist = d
                closest_idx = idx
        name_map[closest_idx] = pt["name"]

    # Precompute distances at station indices
    station_indices = sorted(name_map.keys())
    segment_km_map = {}
    cumulative_km_map = {}
    cumulative_km = 0.0

    for i, idx in enumerate(station_indices):
        segment_km = 0.0 if i == 0 else path_distance_km(
            coordinates, station_indices[i - 1], idx)
        cumulative_km += segment_km
        segment_km_map[idx] = round(segment_km, 4)
        cumulative_km_map[idx] = round(cumulative_km, 4)

    # Build path: station points get distance fields, non-stations omit them
    path = []
    for idx, coord in enumerate(coordinates):
        point = {
            "index": idx,
            "name": name_map.get(idx, ""),
            "desc": "",
            "station": idx in name_map,
            "coordinates": {
                "longitude": coord["longitude"],
                "latitude": coord["latitude"],
                "altitude": coord.get("altitude", 0.0),
            },
        }
        if idx in name_map:
            point["segment_km"] = segment_km_map[idx]
            point["cumulative_km"] = cumulative_km_map[idx]
        path.append(point)

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
