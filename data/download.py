"""
usage: gfswind2png.py [-h] --timestamp TIMESTAMP [--output_dir OUTPUT_DIR]
                      [--clean]
optional arguments:
  -h, --help            show this help message and exit
  --timestamp TIMESTAMP
                        Enter timestamp in YYYYMMDDhh format. hh must be 00,
                        06, 12, 18
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
"""


import os
import pathlib
import json
import argparse
import glob
from datetime import datetime

import requests
from requests import HTTPError
import numpy as np
import rasterio
from rasterio.plot import reshape_as_image
from PIL import Image


def download_data(filename, product, timestamp):
    url = (
        f"https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_{product}.pl?"
        f"file=gfs.t{timestamp[-2:]}z.pgrb2.{product}.f000"
        f"&lev_2_m_above_ground=on&var_TMP=on&leftlon=0"
        f"&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgfs.{timestamp[0:-2]}%2F{timestamp[-2:]}"
    )

    print(url)

    try:
        r = requests.get(url)
        r.raise_for_status()
    except HTTPError as e:
        raise HTTPError("Something went wrong with the data download.") from e

    with open(filename, "wb") as f:
        f.write(r.content)


def import_data(filename):
    with rasterio.open(filename) as src:
        return src.read()

def prepare_data(bands):
    arr = np.array(bands[0, :, :])
    minValue = bands[0, :, :].min()

    def trans(x):
        return str(int(round(x + abs(minValue + 273.15) + 273.15, 1))).zfill(4)

    return list(map(trans, arr.flatten()))


def prepare_png(data, width, height):
    img = Image.new("RGBA",(width, height))

    for j in range(height):
        for i in range(width):
            value = str(data[j * width + i])
            r = int(value[1:2])
            g = int(value[2:3])
            b = int(value[3:4])
            a = 255
            color = (r, g, b, a)
            img.putpixel((i, j), color)
    return img

def build_meta_json(data_dir, datetime, width, height, valueMin, valueMax, data):
    return [{
        "header": {
            "min": round(valueMin, 2),
            "max": round(valueMax, 2),
            "dx": 1,
            "dy": 1,
            "forecastTime": 6,
            "la1": 90,
            "la2": -90,
            "lo1": 0,
            "lo2": 360,
            "nx": width,
            "ny": height,
            "refTime": datetime
        },
        "data": data
    }]


def build_png_json(data_dir, datetime, width, height, valueMin, valueMax, data):
    return {
        "min": round(valueMin + 273.15, 2),
        "max": round(valueMax + 273.15, 2),
        "dx": 1,
        "dy": 1,
        "forecastTime": 6,
        "la1": 90,
        "la2": -90,
        "lo1": 0,
        "lo2": 360,
        "nx": width,
        "ny": height,
        "refTime": datetime
    }


def write_json(data_dir, json_output,filename):
    with open(os.path.join(data_dir, filename), "w") as f:
        f.write(json.dumps(json_output))


def write_image(filename, image):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    image.save(filename)

def resetTmp(x):
    return round(x + 273.15, 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--timestamp",
        type=str,
        required=True,
        help="Enter timestamp in YYYYMMDDhh format. hh must be 00, 06, 12, 18",
    )

    parser.add_argument(
        "--output_dir",
        type=str,
        default=pathlib.Path(__file__).resolve().parent,
        help=(
            "Enter path to directory to save output. "
            "Defaults to the current working directory."
        )
    )

    args = parser.parse_args()

    tilejson_variables = {}

    height = 181
    width = 360

    tilejson_variables["height"] = height
    tilejson_variables["width"] = width

    try:
        tilejson_variables["datetime"] = datetime.strptime(
            f"{args.timestamp}+0000", "%Y%m%d%H%z"
        ).isoformat()
    except ValueError as e:
        raise ValueError("Invalid timestamp entered.") from e

    product = "1p00"

    filename = os.path.join(args.output_dir, f"{args.timestamp}_{product}.grb")

    download_data(filename, product, args.timestamp)
    bands = import_data(filename)

    tilejson_variables["valueMin"] = bands[0, :, :].min() 
    tilejson_variables["valueMax"] = bands[0, :, :].max()
    tilejson_variables["data"] = list(map(resetTmp, np.array(bands[0, :, :]).flatten()))


    data = prepare_data(bands)
    image = prepare_png(data, width, height)

    filename = os.path.join(args.output_dir, "data.png")
    write_image(filename, image)

    json_output = build_meta_json(args.timestamp, **tilejson_variables)
    write_json(os.path.join(args.output_dir), json_output, "data.json")

    png_json_output = build_png_json(args.timestamp, **tilejson_variables)
    write_json(os.path.join(args.output_dir), png_json_output, "png_data.json")
