var gulp = require('gulp');
var $    = require('gulp-load-plugins')();
var gls  = require('gulp-live-server');
var ts   = require('gulp-typescript');

var sassPaths = [
  'bower_components/foundation-sites/scss',
  'bower_components/motion-ui/src'
];

var tsProject = ts.createProject('tsconfig.json', {outFile: 'app.js'});

gulp.task('sass', function() {
  return gulp.src('scss/app.scss')
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'compressed' // if css compressed **file size**
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('css'));
});

gulp.task('scripts', function() {
    var tsResult = gulp
      .src('src/**/*.ts')
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('dist/'));
});

gulp.task('serve', () => {
  var server = gls.static('./', 3000);
  server.start();
  gulp.watch(['dist/**/*.js', 'index.html', 'css/**/**.css'], file => {
    server.notify.apply(server, [file]);
  });
})

gulp.task('default', ['sass', 'scripts', 'serve'], function() {
  gulp.watch(['scss/**/*.scss'], ['sass']);
  gulp.watch(['src/**/*.ts'], ['scripts'])
});
