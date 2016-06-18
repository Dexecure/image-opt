const gulp = require('gulp');
const minify = require('gulp-minify');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const rev = require('gulp-rev');
const runSequence = require('run-sequence');

gulp.task('minify', () => 
  gulp
  .src(['dex-opt.js'])
  .pipe(babel())
  .pipe(minify())
  .pipe(gulp.dest('.tmp'))
);

gulp.task('concat', () =>
	gulp
	.src([".tmp/config.js", ".tmp/dex-opt-min.js"])
	.pipe(concat('dexecure.js'))
	.pipe(gulp.dest('.tmp'))
);

gulp.task('move', () => 
	gulp
	.src(['dex-opt.js', 'config.js'])
	.pipe(gulp.dest('.tmp'))
);

gulp.task('rev', () => 
	gulp
	.src('.tmp/dexecure.js')
	.pipe(rev())
	.pipe(gulp.dest('dist'))
);

gulp.task('clean', () =>
	gulp
	.src(['dist', '.tmp'], {read: false})
	.pipe(clean())
);

gulp.task('default', () => {
	runSequence('clean', 'move', 'minify', 'concat', 'rev');
});