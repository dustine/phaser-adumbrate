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
var scsslint = require('gulp-scss-lint')
var standard = require('gulp-standard')

var paths = {
  assets: 'src/assets/**/*',
  sass: 'src/sass/*.scss',
  css: 'src/css/*.css',
  libs: [
    'src/bower_components/phaser-official/build/phaser.min.js'
  ],
  js: ['src/js/**/*.js'],
  build: './build/',
  dist: './dist/'
}

gulp.task('clean', function () {
  // del now returns a Promise that gulp can use easily
  return del([paths.dist])
})

gulp.task('copy:assets', ['clean'], function () {
  return gulp.src(paths.assets)
    .pipe(gulp.dest(paths.dist + 'assets'))
    .on('error', gutil.log)
})

gulp.task('copy:vendor', ['clean'], function () {
  return gulp.src(paths.libs)
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('uglify', ['clean', 'lint:js'], function () {
  return gulp.src(paths.js)
    .pipe(concat('main.min.js'))
    .pipe(gulp.dest(paths.dist))
    .pipe(uglify({outSourceMaps: false}))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('lint:js', function () {
  return gulp.src(paths.js)
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true
  }))
})

gulp.task('lint:scss', function () {
  return gulp.src(paths.sass)
  .pipe(scsslint())
  .pipe(scsslint.failReporter('E'))
})

gulp.task('minify:css', ['clean', 'sass'], function () {
  return gulp.src(paths.css)
  .pipe(minifycss({
    keepSpecialComments: false,
    removeEmpty: true
  }))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest(paths.dist))
  .on('error', gutil.log)
})

gulp.task('minify:html', ['clean'], function () {
  return gulp.src('dist/index.html')
  .pipe(minifyhtml())
  .pipe(gulp.dest(paths.dist))
  .on('error', gutil.log)
})

gulp.task('process:html', ['clean'], function () {
  return gulp.src('src/index.html')
    .pipe(processhtml({}))
    .pipe(gulp.dest(paths.dist))
    .on('error', gutil.log)
})

gulp.task('sass', ['lint:scss'], function () {
  return gulp.src(paths.sass)
  .pipe(sass())
  .pipe(gulp.dest('src/css/'))
  .pipe(browserSync.stream())
  .on('error', gutil.log)
})

gulp.task('serve', ['sass', 'lint:js'], function () {
  browserSync.init({
    server: {
      baseDir: __dirname + '/src'
    }
  })

  gulp.watch(['./src/index.html'], browserSync.reload)
  gulp.watch([paths.js], ['watch:js'])
  gulp.watch([paths.sass], ['sass'])
})

gulp.task('serve:build', ['build'], function () {
  browserSync.init({
    server: {
      baseDir: __dirname + '/dist'
    }
  })
})

gulp.task('watch:js', ['lint:js'], browserSync.reload)

gulp.task('default', ['serve'])
gulp.task('build', ['copy:assets', 'copy:vendor', 'uglify', 'minify:css', 'process:html', 'minify:html'])
