# Leaflet.Tile.PixelLayer

A pixel layer using Leaflet.TileLayer based on grid vector data, mostly use in meteorological data like NC or Grib2.

# Usage

```js
var tilePixelLayer = L.tilePixelLayer({
  data: data,  //     see demo/temp.json
  gap: 2,      //    1 => 10:   clear => Mosaic
  overlayAlpha: 230,  //  0-255 layer opacity alpha in rgba
  gradient: [
    [233.15, [56, 4, 45]],
    [243.15, [48, 0, 106]],
    ...       // color gradient, [ value,[ r, g, b ] ]
  ]
})
map.addLayer(tilePixelLayer)
```

# Dev

```bash
npm start # local development server
```

```bash
npm build # output dist files
```

# TODO

- [x] click event
- [x] custom color scale
- [x] more map option
- [ ] ui control example
- [ ] data generate example
