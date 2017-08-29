'use strict';

var config = {
    theme_path: './',
    view_path: ''
};

var gulp = require('gulp'),
    liveReload = require('gulp-livereload'),
    compass = require('gulp-compass');

gulp.task('watch', function () {

    // CSS files
    gulp.watch([config.theme_path + 'css/**/*.css']).on("change", function (files) {
        liveReload.changed(files);
    });

    // HTML files
    gulp.watch([config.view_path + '**/*.html', '**/*.html']).on("change", function (files) {
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
            css: config.theme_path + 'dist/css',
            sass: config.theme_path + 'sass',
            sourcemap: false,
            task: 'watch'
        }));
});

gulp.task('default', ['compass', 'watch']);