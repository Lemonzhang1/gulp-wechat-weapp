const { src, dest, parallel, watch, series } = require('gulp');
const Less = require('gulp-less');
const Rename = require("gulp-rename");
const Path = require('path');
const Csso = require('gulp-csso');
const Alias = require('gulp-miniprogram-path-alias');
const Clean = require('gulp-clean');
const GulpIf = require('gulp-if');
const ImageMin = require('gulp-imagemin');
const UrlPrefixer = require('gulp-url-prefixer');
const Qiniu = require('gulp-qiniu-utils');
const ESLint = require('gulp-eslint');
// const Insert = require('gulp-insert');

const path = {
    lessPath: ['src/**/*.less', 'src/**/*.wxss', '!src/style/**', '!src/**/templates/**'],
    jsPath: ['src/**/*.js'],
    copy: ['src/**/*.wxml', 'src/**/*.json', 'src/**/*.wxs'],
    jsonPath: 'src/**/*.json',
    images: ['src/images/*.*']
}

const urlPrefix = {
    prefix: 'https://cdn.liayal.com/dist',
    tags: ['image']
};

const qiniuOptions = {
    ak: 'v6NxwNQtqVpK0Z51X0iq-YXv0Fo8qlFcVxnlYbO6',
    sk: 'b5p89rqZeO8KJEjEvOp3Pk2fHtKEToE5PdSmQLRq',
    zone: 'Zone_z0', //空间对应存储区域（华东：z0，华北：z1，华南：z2，北美：na0）
    bucket: 'hynal-com', //七牛对应空间
    upload: {
        dir: './dist/images', //上传本地目录
        // prefix: 'test/', //上传时添加的前缀，可省略
        except: /\.(html|js)$/ //上传时不上传文件的正则匹配
    },
    remote: {
        url: 'https://cdn.liayal.com', //七牛空间域名
        prefix: {
            default: 'test/', //七牛空间默认前缀，如果下面三个相同可省略
            remove: 'test/', //七牛空间删除前缀
            prefetch: 'test/', //七牛空间预取前缀
            refresh: 'test/' //七牛空间刷新前缀
        }
    }
};

function _join(dirname) {
    return Path.join(process.cwd(), 'src', dirname);
};

const aliasConfig = {
    '@Libs': _join('libs'),
    '@Utils': _join('utils'),
    '@Components': _join('components'),
    '@Style': _join('style'),
    '@Images': _join('images')
};

// 自定义ESlint 配置
const eslintConfig = {
    rules: {
        'my-custom-rule': 1,
    },
    globals: [
        'App',
        'Page',
        'wx',
    ],
    envs: [
        'browser',
    ],
};


function wxss() {
    return src(path.lessPath, { base: 'src/' })
        .pipe(Alias(aliasConfig))
        .pipe(Less())
        .pipe(UrlPrefixer.css(urlPrefix))
        .pipe(GulpIf(process.env.NODE_ENV === 'production', Csso()))
        .pipe(Rename({
            extname: ".wxss"
        }))
        .pipe(dest("dist"));
}


function js() {
    return src(path.jsPath)
        .pipe(Alias(aliasConfig))
        .pipe(ESLint())
        .pipe(ESLint.format())
        .pipe(dest("dist"));
}

function copy() {
    return src(path.copy)
        .pipe(Alias(aliasConfig))
        .pipe(UrlPrefixer.html(urlPrefix))
        .pipe(dest("dist"))
}

function imagemin() {
    return src(path.images)
        .pipe(ImageMin())
        .pipe(dest("dist/images"))
}

function imageUpload(cb) {
    const qiniu = new Qiniu(qiniuOptions);
    qiniu.upload();
    cb();
}

const images = series(imagemin, cb => {
    const qiniu = new Qiniu(qiniuOptions);
    qiniu.upload();
})

function clean() {
    return src('dist/*', { read: false })
        .pipe(Clean());
}


// exports.js = js;
// exports.wxss = wxss;
// exports.copy = copy;
watch(path.lessPath, wxss);
watch(path.jsPath, js);
watch(path.copy, copy);
watch(path.images, images);

// exports.build = series(clean, parallel(copy, wxss, js));
exports.default = series(clean, parallel(copy, wxss, js, images));
// exports.default = clean;