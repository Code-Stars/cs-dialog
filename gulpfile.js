'use strict';

var config = {
    theme_path: './'
};

var gulp = require('gulp'),
    liveReload = require('gulp-livereload'),
    compass = require('gulp-compass'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    pump = require('pump'),
    cleanCSS = require('gulp-clean-css');

gulp.task('watch', function () {

    // CSS files
    gulp.watch([config.theme_path + 'css/**/*.css']).on("change", function (files) {
        liveReload.changed(files);
    });

    // HTML files
    gulp.watch([config.theme_path + '**/*.html', '**/*.html']).on("change", function (files) {
        liveReload.changed(files);
    });

    // JS files
    gulp.watch([config.theme_path + 'src/*.js']).on("change", function (files) {
        liveReload.changed(files);
    });

    // PHP files
    gulp.watch(['**/*.php']).on("change", function (files) {
        liveReload.changed(files);
    });
});

gulp.task('compass', function () {
    liveReload.listen();

    gulp.src(config.theme_path + 'sass/**/*.scss')
        .pipe(compass({
            debug: false,
            css: config.theme_path + 'dist',
            sass: config.theme_path + 'sass',
            sourcemap: false,
            task: 'watch'
        }));
});

gulp.task('compress', function (cb) {
    // here we are going to build
    // the project for production
    pump([
            gulp.src(['src/*.js']),
            concat('cs-dialog.js'),
            gulp.dest('dist'),
            uglify(),
            rename({suffix: '.min', basename: 'cs-dialog'}),
            gulp.dest('dist')
        ]
    );

    pump([
            gulp.src('dist/cs-dialog.css'),
            cleanCSS({compatibility: 'ie8'}),
            rename({suffix: '.min'}),
            gulp.dest('dist')
        ],
        cb
    );
});

gulp.task('default', ['compass', 'watch']);
gulp.task('build', ['compress']);
