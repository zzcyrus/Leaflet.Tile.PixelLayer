# Leaflet.Tile.PixelLayer

一个基于 Leaflet 瓦片图层的扩展插件，通常用来展示气象格点数据。

# 演示

[Demo](https://kael.top/Leaflet.Tile.PixelLayer/demo/)
[相关blog说明](https://kael.top/2020/05/17/web-grid-data-render-1/)

# 使用

两种数据方式：

1. 直接传入格点数据，可以参考`demo/data.json`
2. 将格点数据写入 png，只把头文件信息写入 json，可以参考`demo/png_data.json`和`demo/data.png`，这种方式可以减少文件大小

```js
var tilePixelLayer = L.tilePixelLayer({
  data: data,
  url: './data.png',  // 仅在png加载中生效
  overlayAlpha: 230,  //  透明度
  gradient: [
    [233.15, [56, 4, 45]],
    [243.15, [48, 0, 106]],
    ...       // 色卡 [ 数值,[ r, g, b ] ]
  ]
})
map.addLayer(tilePixelLayer)
```

# 数据下载

```bash
python ./data/download.py --timestamp 2019111406 --output_dir ./output
```

# 开发

```bash
npm start # local development server
```

# 计划

- [x] click event
- [x] custom color scale
- [x] more map option
- [ ] ui control example
- [x] data generate example
