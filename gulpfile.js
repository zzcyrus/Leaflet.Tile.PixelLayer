const gulp = require('gulp')
const babel = require('gulp-babel')
const concat = require('gulp-concat')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const connect = require('gulp-connect')

gulp.task('build', function() {
  return gulp
    .src(['./src/**.js'])
    .pipe(concat('leaflet-tile-pixelLayer.js'))
    .pipe(
      babel({
        presets: ['@babel/preset-env']
      })
    )
    .pipe(gulp.dest('dist'))
    .pipe(rename('leaflet-tile-pixelLayer.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload())
})

gulp.task('default', function() {
  connect.server({
    port: 3000,
    livereload: true
  })
  gulp.watch('./src/**.js', gulp.series('build'))
  gulp.watch('./gulpfile.js', gulp.series('build'))
})
