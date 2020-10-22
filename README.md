# Leaflet.Tile.PixelLayer

A pixel layer using Leaflet.TileLayer based on grid vector data, mostly use in meteorological data like NC or Grib2.

[中文文档](./README_CN.md)
[相关blog说明](https://kael.top/2020/05/17/web-grid-data-render-1/)

# Demo

[demo](https://kael.top/Leaflet.Tile.PixelLayer/demo/)

# Usage

```js
var tilePixelLayer = L.tilePixelLayer({
  data: data,  //     see demo/data.json,
  url: './data.png', // need this option if use png data
  overlayAlpha: 230,  //  0-255 layer opacity alpha in rgba
  gradient: [
    [233.15, [56, 4, 45]],
    [243.15, [48, 0, 106]],
    ...       // color gradient, [ value,[ r, g, b ] ]
  ]
})
map.addLayer(tilePixelLayer)
```

# Data process

```bash
python ./data/download.py --timestamp 2019111406 --output_dir ./output
```

# Dev

```bash
npm start # local development server
```

# TODO

- [x] click event
- [x] custom color scale
- [x] more map option
- [ ] ui control example
- [x] data generate example
