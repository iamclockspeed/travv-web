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

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1)
        * math.cos(phi2)
        * math.sin(dlam / 2) ** 2
    )

    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def path_distance_km(coordinates, from_idx, to_idx):
    """Sum of haversine segments along the path from from_idx to to_idx."""
    total = 0.0

    for i in range(from_idx, to_idx):
        c1 = coordinates[i]
        c2 = coordinates[i + 1]

        total += haversine_km(
            c1["latitude"],
            c1["longitude"],
            c2["latitude"],
            c2["longitude"],
        )

    return total


def convert_to_path(data, coordinates=None):
    """
    Convert source data into the output path format.

    If coordinates are supplied, they are used instead of the
    original LineString coordinates. This allows the route to
    be recalculated in either direction.
    """

    named_points = [
        p for p in data["placemarks"]
        if p["type"] == "Point"
    ]

    if coordinates is None:
        linestring = next(
            p for p in data["placemarks"]
            if p["type"] == "LineString"
        )
        coordinates = linestring["coordinates"]

    # Find the closest path coordinate for every named point.
    name_map = {}

    for pt in named_points:
        min_dist = float("inf")
        closest_idx = -1

        for idx, coord in enumerate(coordinates):
            d = distance(
                coord["latitude"],
                coord["longitude"],
                pt["coordinates"]["latitude"],
                pt["coordinates"]["longitude"],
            )

            if d < min_dist:
                min_dist = d
                closest_idx = idx

        name_map[closest_idx] = pt["name"]

    # Precompute station distances.
    station_indices = sorted(name_map.keys())

    segment_km_map = {}
    cumulative_km_map = {}

    cumulative_km = 0.0

    for i, idx in enumerate(station_indices):
        if i == 0:
            segment_km = 0.0
        else:
            segment_km = path_distance_km(
                coordinates,
                station_indices[i - 1],
                idx,
            )

        cumulative_km += segment_km

        segment_km_map[idx] = round(segment_km, 4)
        cumulative_km_map[idx] = round(cumulative_km, 4)

    # Build final path.
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


def flip_path(result):
    """
    Reverse an already generated path and recalculate all
    dependent values.
    """

    original_path = result["path"]

    # Reverse the physical route.
    reversed_path = list(reversed(original_path))

    # Extract coordinates.
    coordinates = [
        point["coordinates"]
        for point in reversed_path
    ]

    # Preserve station names from their physical locations.
    #
    # After reversing the list, the station information is already
    # attached to the correct physical coordinate.
    stations = []

    for point in reversed_path:
        if point["station"]:
            stations.append({
                "name": point["name"],
                "coordinates": point["coordinates"],
            })

    # Find each station's new index.
    name_map = {}

    for station in stations:
        for idx, coord in enumerate(coordinates):
            if (
                coord["latitude"] == station["coordinates"]["latitude"]
                and coord["longitude"] == station["coordinates"]["longitude"]
            ):
                name_map[idx] = station["name"]
                break

    # Recalculate distances in the new direction.
    station_indices = sorted(name_map.keys())

    segment_km_map = {}
    cumulative_km_map = {}

    cumulative_km = 0.0

    for i, idx in enumerate(station_indices):
        if i == 0:
            segment_km = 0.0
        else:
            segment_km = path_distance_km(
                coordinates,
                station_indices[i - 1],
                idx,
            )

        cumulative_km += segment_km

        segment_km_map[idx] = round(segment_km, 4)
        cumulative_km_map[idx] = round(cumulative_km, 4)

    # Build flipped path with new indices and recalculated distances.
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
        print("Usage: python convert_path.py <input.json>")
        sys.exit(1)

    input_file = sys.argv[1]

    base, ext = (
        input_file.rsplit(".", 1)
        if "." in input_file
        else (input_file, "json")
    )

    output_file = f"{base}_output.{ext}"
    flipped_output_file = f"{base}_output_flipped.{ext}"

    # Read input.
    with open(input_file, "r") as f:
        input_data = json.load(f)

    # Create original route.
    result = convert_to_path(input_data)

    # Create flipped route.
    flipped_result = flip_path(result)

    # Save original.
    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)

    # Save flipped.
    with open(flipped_output_file, "w") as f:
        json.dump(flipped_result, f, indent=2)

    print(f"Done!")
    print(f"Original: {output_file}")
    print(f"Flipped:  {flipped_output_file}")
