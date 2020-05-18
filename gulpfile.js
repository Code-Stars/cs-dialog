'use strict';

const config = {
    image_path: './images/',
    js_path: './',
    css_path: './',
    sass_path: './sass/',
    src_path: './src/',
    vendor_path: './vendor/'
};

const gulp = require('gulp'),
    sass = require('gulp-sass'),
    livereload = require('gulp-livereload'),
    cleanCSS = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    clean = require('gulp-clean'),
    notify = require("gulp-notify"),
    sourcemaps = require('gulp-sourcemaps'),
    path = require('path'),
    imagemin = require('gulp-imagemin'),
    file = require('gulp-file');

// output current build version
function deploy_version(dist_path) {
    var uniqueVersion = Date.now() + ( (Math.random() * 100000).toFixed());

    return file('version.txt', uniqueVersion.toString())
        .pipe(gulp.dest(dist_path));
}

gulp.task('watch', function () {

    livereload.listen();

    // SASS files
    gulp.watch(config.sass_path + '**/*.scss', gulp.series('watch-sass'));

    // JS files
    gulp.watch(config.src_path + '**/**/*.js', gulp.series('watch-js'));

    // HTML files
    gulp.watch('./**/*.html').on('change', function (files) {
        livereload.changed(files);
    });
});

// build cs-dialog.css
gulp.task('watch-sass', function () {
    return gulp.src(config.sass_path + '**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.css_path + 'dist/'))
        .pipe(livereload());
});

// build cs-dialog.min.css
gulp.task('build-custom-css', function () {

    deploy_version('dist/');

    return gulp.src(config.css_path + 'dist/cs-dialog.css')
        .pipe(cleanCSS({compatibility: 'ie8', level: {1: {specialComments: 0}}}))
        .pipe(rename({suffix: '.min', basename: 'cs-dialog'}))
        .pipe(gulp.dest(config.css_path + 'dist'))
        .pipe(notify("Custom CSS was built"));
});

// build cs-dialog.js
gulp.task('watch-js', function () {

    return gulp.src([
        config.src_path + '/cs-dialog.js',
        config.src_path + '/cs-utils.js'
    ])
        .pipe(concat('cs-dialog.js'))
        .pipe(gulp.dest(config.js_path + 'dist/'))
        .pipe(livereload());
});

// build cs-dialog.min.js
gulp.task('build-custom-script', function () {

    deploy_version('dist/');

    return gulp.src([config.js_path + 'dist/cs-dialog.js'])
        .pipe(uglify())
        .pipe(rename({suffix: '.min', basename: 'cs-dialog'}))
        .pipe(gulp.dest('dist'))
        .pipe(notify("Custom js built for production"));
});

gulp.task('default', gulp.parallel('watch'));
gulp.task('build', gulp.series(['build-custom-css', 'build-custom-script']));
