var gulp = require('gulp')
var gutil = require('gulp-util')
var del = require('del')
var concat = require('gulp-concat')
var rename = require('gulp-rename')
var minifycss = require('gulp-minify-css')
var minifyhtml = require('gulp-minify-html')
var processhtml = require('gulp-processhtml')
var uglify = require('gulp-uglify')

var browserSync = require('browser-sync').create()
var sass = require('gulp-sass')
var standard = require('gulp-standard')

var paths = {
  assets: 'src/assets/**/*',
  scss: 'src/css/*.scss',
  css: 'src/css/*.css',
  libs: [
    'src/bower_components/phaser-official/build/phaser.min.js'
  ],
  js: ['src/js/**/*.js'],
  dist: './dist/'
}

gulp.task('clean', function (cb) {
  del([paths.dist], cb)
})

gulp.task('copy-assets', ['clean'], function () {
  gulp.src(paths.assets)
    .pipe(gulp.dest(paths.dist + 'assets'))
    .on('error', gutil.log)
})

gulp.task('copy-vendor', ['clean'], function () {
  gulp.src(paths.libs)
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('uglify', ['clean', 'lint'], function () {
  gulp.src(paths.js)
    .pipe(concat('main.min.js'))
    .pipe(gulp.dest(paths.dist))
    .pipe(uglify({outSourceMaps: false}))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('sass', ['clean'], function () {
  return gulp.src(paths.scss)
    .pipe(sass())
    .pipe(gulp.dest(paths.css))
    .pipe(browserSync.stream())
    .on('error', gutil.log)
})

gulp.task('minifycss', ['clean', 'sass'], function () {
  gulp.src(paths.css)
    .pipe(minifycss({
      keepSpecialComments: false,
      removeEmpty: true
    }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('processhtml', ['clean'], function () {
  gulp.src('src/index.html')
    .pipe(processhtml({}))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('minifyhtml', ['clean'], function () {
  gulp.src('dist/index.html')
    .pipe(minifyhtml())
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('lint', function () {
  gulp.src(paths.js)
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
    .on('error', gutil.log)
})

gulp.task('sass-watch', ['sass'], browserSync.reload)

gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: __dirname + '/src'
    }
  })

  gulp.watch(paths.js, ['lint'])
  gulp.watch(['./src/index.html', paths.js], browserSync.reload)
  gulp.watch([paths.scss], ['sass-watch'])
})

gulp.task('default', ['serve'])
gulp.task('build', ['copy-assets', 'copy-vendor', 'uglify', 'minifycss', 'processhtml', 'minifyhtml'])
