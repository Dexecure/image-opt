const gulp = require('gulp');
const minify = require('gulp-minify');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const rev = require('gulp-rev');
const runSequence = require('run-sequence');
const merge = require('gulp-merge-json');
const insert = require('gulp-insert');

gulp.task('minify', () => 
  gulp
  .src(['dex-opt.js'])
  .pipe(babel())
  .pipe(minify())
  .pipe(gulp.dest('.tmp'))
);

gulp.task('concat', () =>
	gulp
	.src([".tmp/config.json", ".tmp/dex-opt-min.js"])
	.pipe(concat('dexecure.js'))
	.pipe(insert.prepend("var dexecure = "))
	.pipe(gulp.dest('.tmp'))
);

gulp.task('move', () => 
	gulp
	.src(['dex-opt.js', 'index.html'])
	.pipe(gulp.dest('.tmp'))
);

gulp.task('rev', () => 
	gulp
	.src('.tmp/dexecure.js')
	.pipe(rev())
	.pipe(gulp.dest('dist'))
	.pipe(rev.manifest())
	.pipe(gulp.dest('.tmp'))
);

gulp.task('clean', () =>
	gulp
	.src(['dist', '.tmp'], {read: false})
	.pipe(clean())
);

gulp.task('html', () => {
	var fs = require('fs');
	var scriptName = JSON.parse(fs.readFileSync('.tmp/rev-manifest.json'))["dexecure.js"];
	console.log(scriptName);
	var scriptToInject = `<script>var DEXECURE_URL = "/${scriptName}";</script>`;
	return gulp
	.src('.tmp/index.html')
	.pipe(insert.prepend(scriptToInject))
	.pipe(gulp.dest("dist"));
});

gulp.task('config', () => {
	gulp
	.src(['config.default.json', 'config.user.json'])
	.pipe(merge('config.json'))
	.pipe(gulp.dest('.tmp'))
});

gulp.task('default', () => {
	runSequence('clean', 'move', ['minify', 'config'], 'concat', 'rev', 'html');
});