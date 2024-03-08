import gulp from 'gulp'
import pug from 'gulp-pug'
import gulpSass from 'gulp-sass'
import dartSass from 'sass'
import browserSync from 'browser-sync'
import replace from 'gulp-replace'

const sass = gulpSass(dartSass)

const watchPaths = {
    src: {
        pug: 'src/**/*.pug',
        sass: 'src/**/*.s[ac]ss',
        assets: 'assets/**/*',
    },
}

const paths = {
    src: {
        pug: 'src/*.pug',
        sass: 'src/*.s[ac]ss',
        assets: 'src/assets/**/*'
    },
    dest: {
        html: 'dist/',
        css: 'dist/',
        assets: 'dist/assets',
    }
};

function convertPug() {
    return gulp.src(paths.src.pug)
        .pipe(pug())
        .pipe(gulp.dest(paths.dest.html))
        .pipe(browserSync.stream());
}

function convertPugProd() {
    return gulp.src(paths.src.pug)
        .pipe(pug())
        .pipe(replace('/assets/', '/OnPoint_landing/assets/'))
        .pipe(gulp.dest(paths.dest.html))
        .pipe(browserSync.stream());
}

function convertSass() {
    return gulp.src(paths.src.sass)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.dest.css))
        .pipe(browserSync.stream());
}

function convertSassProd() {
    return gulp.src(paths.src.sass)
        .pipe(sass().on('error', sass.logError))
        .pipe(replace('/assets/', '/OnPoint_landing/assets/'))
        .pipe(gulp.dest(paths.dest.css))
        .pipe(browserSync.stream());
}

function copyAssets() {
    return gulp.src(paths.src.assets)
        .pipe(gulp.dest(paths.dest.assets))
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

export const build = gulp.parallel(convertPugProd, convertSassProd, copyAssets);

export { convertPug, convertSass, watchFiles };
export default watchFiles;
