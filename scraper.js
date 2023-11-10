"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var axios_1 = require("axios");
var cheerio = require("cheerio");
var _a = process.argv, tagA = _a[2], tagB = _a[3];
var RESULTS_URL = 'https://danbooru.donmai.us/posts';
var POST_URL = 'https://danbooru.donmai.us/posts';
var tags = tagB ? "".concat(tagA, "+").concat(tagB) : tagA;
var contentful_page = true;
/**
 *
 * @param page page number
 * @returns an axios Response object
 */
var fetch_results_page = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    var res, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.get("".concat(RESULTS_URL, "?tags=").concat(tags, "&page=").concat(page))];
            case 1:
                res = _a.sent();
                return [2 /*return*/, res];
            case 2:
                err_1 = _a.sent();
                console.error(err_1);
                return [3 /*break*/, 3];
            case 3:
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); };
/**
 *
 * @param results_data html data
 * @returns array of post ids
 */
var fetch_post_ids = function (results_data) {
    var $ = cheerio.load(results_data);
    var articles = $('article');
    if (articles.length === 0) {
        if ($('#posts').children().children().prop('innerText') !== "No posts found.") {
            console.error('Unable to fetch posts （泣）');
            process.exit(1);
        }
        console.warn('Seems like that was the last page');
        contentful_page = false;
    }
    var ids = [];
    for (var i = 0; i < articles.length; i++) {
        var hit = articles[i];
        try {
            if (hit.attribs.id.slice(0, 5) !== 'post_')
                throw new Error('Unknown article element found');
        }
        catch (err) {
            console.warn(err.message, err);
            continue;
        }
        ids[i] = hit.attribs['data-id'];
    }
    if (ids.length !== articles.length)
        console.warn('Missed one or more post ids\n');
    return ids;
};
/**
 *
 * @param ids array of post ids
 * @returns array with elements of the form ['/post/\<post_id\>', data]
 */
var fetch_post_pages = function (ids) { return __awaiter(void 0, void 0, void 0, function () {
    var reqs, i, res_html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                reqs = [];
                for (i = 0; i < ids.length; i++) {
                    reqs[i] = axios_1.default.get("".concat(POST_URL, "/").concat(ids[i]));
                }
                res_html = [];
                return [4 /*yield*/, Promise.all(reqs)];
            case 1:
                (_a.sent()).forEach(function (res, i) { return res_html[i] = [(res.request.path).slice(7), res.data]; });
                return [2 /*return*/, res_html];
        }
    });
}); };
/**
 *
 * @param raw_html array of [post path, post page]
 * @returns array of [post path, cdn endpoints]
 */
var parse_file_urls = function (raw_html) {
    var urls = [];
    for (var i = 0; i < raw_html.length; i++) {
        var $ = cheerio.load(raw_html[i][1]);
        var prop = $('#content').children('section').attr('data-file-url');
        if (prop)
            urls.push([raw_html[i][0], prop]);
    }
    if (urls.length !== raw_html.length)
        console.warn('Missed one or more images');
    return urls;
};
/**
 *
 * @param urls array of urls
 * @returns void
 */
var fetch_files = function (urls) { return __awaiter(void 0, void 0, void 0, function () {
    var reqs, i, write_to_disk;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                reqs = [];
                for (i = 0; i < urls.length; i++) {
                    reqs[i] = axios_1.default.get(urls[i][1], { responseType: 'arraybuffer' });
                }
                write_to_disk = [];
                return [4 /*yield*/, Promise.all(Object.values(reqs))];
            case 1:
                (_a.sent()).forEach(function (res, i, arr) {
                    var path = './output/' + urls[i][0] + res.request.path.slice(-4);
                    write_to_disk.push(fs.promises.writeFile(path, res.data));
                });
                return [4 /*yield*/, Promise.all(write_to_disk)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var results_page, current_page, post_ids, post_pages, file_urls, dir;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                current_page = 1;
                _a.label = 1;
            case 1:
                if (!contentful_page) return [3 /*break*/, 5];
                console.log('Fetching images from page', current_page);
                return [4 /*yield*/, fetch_results_page(current_page)];
            case 2:
                results_page = _a.sent();
                post_ids = fetch_post_ids(results_page.data);
                return [4 /*yield*/, fetch_post_pages(post_ids)];
            case 3:
                post_pages = _a.sent();
                file_urls = parse_file_urls(post_pages);
                dir = './output';
                if (!fs.existsSync(dir))
                    fs.mkdirSync(dir);
                return [4 /*yield*/, fetch_files(file_urls)];
            case 4:
                _a.sent();
                current_page++;
                return [3 /*break*/, 1];
            case 5:
                console.log('Bai bai!');
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); };
main();
