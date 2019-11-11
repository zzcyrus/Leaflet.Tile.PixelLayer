'use strict'
;(function() {
  function isValue(x) {
    return x !== null && x !== undefined
  }

  function colorInterpolator(pre, next) {
    var r = pre[0],
      g = pre[1],
      b = pre[2],
      aDiff = next[0] - r,
      gDiff = next[1] - g,
      bDiff = next[2] - b
    return function(proportion, alpha) {
      return [
        Math.floor(r + proportion * aDiff),
        Math.floor(g + proportion * gDiff),
        Math.floor(b + proportion * bDiff),
        alpha
      ]
    }
  }

  function floorMod(a, n) {
    return a - n * Math.floor(a / n)
  }

  function clamp(value, range) {
    return Math.max(range[0], Math.min(value, range[1]))
  }

  function proportion(value, low, high) {
    return (clamp(value, [low, high]) - low) / (high - low)
  }

  function segmentColorScale(gradient) {
    var colors = []
    var colorInterpolators = []
    var colorRanges = []
    for (var i = 0; i < gradient.length - 1; i++) {
      colors.push(gradient[i + 1][0])
      colorInterpolators.push(
        colorInterpolator(gradient[i][1], gradient[i + 1][1])
      )
      colorRanges.push([gradient[i][0], gradient[i + 1][0]])
    }
    return function(value, alpha) {
      for (var i = 0; i < colors.length - 1 && !(value <= colors[i]); i++);
      var range = colorRanges[i]
      return colorInterpolators[i](proportion(value, range[0], range[1]), alpha)
    }
  }

  L.TilePixelLayer = L.TileLayer.extend({
    options: {
      data: null,
      overlayAlpha: 230,
      unit: '',
      zIndex: 7,
      gradient: segmentColorScale([
        [233.15, [56, 4, 45]],
        [243.15, [48, 0, 106]],
        [253.15, [0, 14, 134]],
        [256.15, [3, 44, 144]],
        [218.15, [9, 69, 162]],
        [263.15, [37, 110, 174]],
        [268.15, [4, 147, 204]],
        [275.15, [17, 180, 240]],
        [278.15, [92, 214, 205]],
        [283.15, [112, 190, 125]],
        [288.15, [161, 209, 115]],
        [293.15, [255, 247, 105]],
        [298.15, [240, 200, 68]],
        [303.15, [247, 151, 19]],
        [308.15, [214, 30, 0]],
        [313.15, [151, 14, 2]],
        [318.15, [107, 11, 0]],
        [323.15, [73, 1, 3]]
      ])
    },
    map: null,
    builder: null,
    grid: null,
    gridDataBuilt: null,
    date: null,
    replaceNaN: true,
    replaceNaNValue: 0,
    zooming: false,
    λ0: null,
    φ0: null,
    Δλ: null,
    Δφ: null,
    ni: null,
    nj: null,
    triggerDraw: [],
    initialize: function(options) {
      L.setOptions(this, options)
      L.TileLayer.prototype.initialize.call(this, options)
    },
    createTile: function(coords) {
      var dom = L.DomUtil.create('canvas', 'leaflet-pixel-tile')
      var size = this.getTileSize()
      dom.width = size.x
      dom.height = size.y
      if (this.zooming) return dom
      var ctx = dom.getContext('2d')
      var bounds = {
        x: coords.x * dom.width,
        y: coords.y * dom.height,
        z: coords.z,
        w: dom.width,
        h: dom.height
      }
      var that = this
      return (
        that.gridDataBuilt
          ? that.interpolateField(ctx, bounds, function(image) {
              ctx.putImageData(image, 0, 0)
            })
          : that.triggerDraw.push(function() {
              that.interpolateField(ctx, bounds, function(image) {
                ctx.putImageData(image, 0, 0)
              })
            }),
        dom
      )
    },
    onAdd: function(map) {
      var that = this
      this.triggerDraw.splice(0, this.triggerDraw.length)
      this.map = map
      this.handleZoom()
      this.initHandlers()
      this.buildGrid(that.options.data, function(t) {
        that.gridDataBuilt = t
        for (var n = 0; n < that.triggerDraw.length; n++) that.triggerDraw[n]()
        that.triggerDraw = []
      })
      this.map.on('click', e => {
        const { latlng } = e
        const { lat, lng } = latlng
        var gridValue = that.gridDataBuilt.interpolate(lng, lat)
        this.options.clickEvt && this.options.clickEvt(e, gridValue)
      })
      L.TileLayer.prototype.onAdd.call(this, map)
    },
    onRemove: function(map) {
      this.gridDataBuilt = null
      this.triggerDraw && this.triggerDraw.splice(0, this.triggerDraw.length)
      L.TileLayer.prototype.onRemove.call(this, map)
    },
    initHandlers: function() {
      var that = this
      this.map.on('zoomstart', function() {
        that.lastZoomDate = Date.now()
        that.options.maxNativeZoom = that._tileZoom
        L.setOptions(that, that.options)
        that.zooming = true
      })
    },
    handleZoom: function() {
      var that = this
      that.oldMapZoom = that.map.getZoom()
      that.oldTileZoom = that._tileZoom
      clearInterval(that.map.zoomInterval)
      that.map.zoomInterval = setInterval(function() {
        if (Date.now() - that.lastZoomDate > 500 && that.zooming) {
          that.zooming = false
          that.options.maxNativeZoom = 13
          L.setOptions(that, that.options)
          var e = that.oldMapZoom - that.map.getZoom() > 0.2
          var n = that.oldTileZoom != Math.floor(that.map.getZoom())
          var r = void 0 === that.oldTileZoom
          if (e || n || r) {
            that.redraw()
            that.oldTileZoom = that._tileZoom
            that.oldMapZoom = that.map.getZoom()
            that.options.maxNativeZoom = that._tileZoom
            L.setOptions(that, that.options)
          }
        }
      }, 300)
    },
    createBuilder: function(data) {
      var that = this
      return {
        header: data.header,
        data: function(i) {
          return data.data[i]
        },
        interpolate: that.bilinearInterpolateScalar
      }
    },
    buildGrid: function(gridData, callback) {
      var that = this
      this.builder = this.createBuilder(gridData[0])
      var header = this.builder.header
      this.λ0 = header.lo1
      this.φ0 = header.la1
      this.Δλ = header.dx
      this.Δφ = header.dy
      this.ni = header.nx
      this.nj = header.ny
      this.date = new Date(header.refTime)
      this.date.setHours(this.date.getHours() + header.forecastTime)
      this.grid = []
      var inner = Math.floor(this.ni * this.Δλ) >= 360
      for (var i = 0, y = 0; y < this.nj; y++) {
        var result = []
        for (var x = 0; x < this.ni; x++, i++) {
          result[x] = this.builder.data(i)
          if (this.replaceNaN && isNaN(result[x])) {
            result[x] = this.replaceNaNValue
          }
        }
        if (inner) {
          result.push(result[0])
          this.grid[y] = result
        }
      }
      callback({
        date: this.date,
        interpolate: function(λ, φ) {
          if (!that.grid) return null
          var i = floorMod(λ - that.λ0, 360) / that.Δλ

          var j = (that.φ0 - φ) / that.Δφ

          var fi = Math.floor(i),
            ci = fi + 1
          var fj = Math.floor(j),
            cj = fj + 1
          var row

          if ((row = that.grid[fj])) {
            var g00 = row[fi]
            var g10 = row[ci]

            if (isValue(g00) && isValue(g10) && (row = that.grid[cj])) {
              var g01 = row[fi]
              var g11 = row[ci]

              if (isValue(g01) && isValue(g11)) {
                return that.builder.interpolate(
                  i - fi,
                  j - fj,
                  g00,
                  g10,
                  g01,
                  g11
                )
              }
            }
          }

          return null
        }
      })
    },
    pointToCoord: function(x, y, zoom) {
      var location = this.map.unproject(L.point(x, y), zoom)
      return [location.lng, location.lat]
    },
    createMask: function(ctx, bounds) {
      if (!ctx) return null
      var width = bounds.w
      var height = bounds.h
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fill()
      var imageData = ctx.getImageData(0, 0, width, height)
      var imageDataRaw = imageData.data
      return {
        imageData: imageData,
        set: function(x, y, color) {
          var index = 4 * (y * width + x)
          imageDataRaw[index] = color[0]
          imageDataRaw[index + 1] = color[1]
          imageDataRaw[index + 2] = color[2]
          imageDataRaw[index + 3] = color[3]
          return this
        }
      }
    },
    bilinearInterpolateScalar: function(x, y, g00, g10, g01, g11) {
      var rx = 1 - x
      var ry = 1 - y
      return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y
    },
    interpolateField: function(ctx, bounds, render) {
      var that = this
      var x = bounds.x
      var tileX = 0
      var xGap = 2
      var yGap = 2
      var mask = this.createMask(ctx, bounds)
      function interpolateColumn(x, tileX) {
        for (
          var defaultColor = [0, 0, 0, 1], y = bounds.y, height = 0;
          height <= bounds.h;
          y += yGap, height += yGap
        ) {
          var color = defaultColor
          var coord = that.pointToCoord(x, y, bounds.z)
          if (coord) {
            var λ = coord[0]
            var φ = coord[1]
            if (isFinite(λ)) {
              var gridValue = that.gridDataBuilt.interpolate(λ, φ)
              if (isValue(gridValue)) {
                color = that.options.gradient(
                  gridValue,
                  that.options.overlayAlpha
                )
              }
            }
          }
          for (var i = 0; i < xGap; i++) {
            for (var j = 0; j < yGap; j++) {
              mask.set(tileX + i, height + j, color)
            }
          }
        }
      }

      ;(function batchInterpolate() {
        var start = Date.now()

        while (tileX < bounds.w) {
          interpolateColumn(x, tileX)
          x += xGap
          tileX += xGap

          if (Date.now() - start > 500) {
            setTimeout(batchInterpolate, 25)
            return
          }
        }

        render(mask.imageData)
      })()
    }
  })

  L.tilePixelLayer = function(options) {
    return new L.TilePixelLayer(options)
  }
})()
