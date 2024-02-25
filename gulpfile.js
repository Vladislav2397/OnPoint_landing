import gulp from 'gulp'
import pug from 'gulp-pug'
import gulpSass from 'gulp-sass'
import dartSass from 'sass'
import browserSync from 'browser-sync'

const sass = gulpSass(dartSass)

const watchPaths = {
    src: {
        pug: 'src/**/*.pug',
        sass: 'src/**/*.s[ac]ss'
    },
}

const paths = {
    src: {
        pug: 'src/*.pug',
        sass: 'src/*.s[ac]ss'
    },
    dest: {
        html: 'dist/',
        css: 'dist/'
    }
};

function convertPug() {
    return gulp.src(paths.src.pug)
        .pipe(pug())
        .pipe(gulp.dest(paths.dest.html))
        .pipe(browserSync.stream());
}

function convertSass() {
    return gulp.src(paths.src.sass)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.dest.css))
        .pipe(browserSync.stream());
}

function watchFiles() {
    browserSync.init({
        server: {
            baseDir: './dist'
        }
    });

    gulp.watch(watchPaths.src.pug, convertPug);
    gulp.watch(watchPaths.src.sass, convertSass);
    gulp.watch('dist/*.html').on('change', browserSync.reload);
}

const build = gulp.parallel(convertPug, convertSass);

export { convertPug, convertSass, watchFiles };
export default watchFiles;
