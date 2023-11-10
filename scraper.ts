import * as fs from 'fs';
import axios from "axios";
import * as cheerio from 'cheerio';

const [, , tagA, tagB] = process.argv;

const RESULTS_URL = 'https://danbooru.donmai.us/posts';
const POST_URL = 'https://danbooru.donmai.us/posts';

const tags: String = tagB ? `${tagA}+${tagB}` : tagA;

var contentful_page = true;

/**
 * 
 * @param page page number
 * @returns an axios Response object
 */
const fetch_results_page = async (page: number) => {
    try {
      const res = await axios.get(`${RESULTS_URL}?tags=${tags}&page=${page}`);
      return res;
    } catch (err) {
      console.error(err);
    }

    process.exit(1)
  }

/**
 * 
 * @param results_data html data
 * @returns array of post ids
 */
const fetch_post_ids = (results_data: any): string[] => {
    const $ = cheerio.load(results_data);
    const articles = $('article');

    if (articles.length === 0) {
        if ($('#posts').children().children().prop('innerText') !== "No posts found.") {
            console.error('Unable to fetch posts （泣）');
            process.exit(1);
        }

        console.warn('Seems like that was the last page')
        contentful_page = false;
    }

    let ids = [];
    
    for (let i = 0; i < articles.length; i++) {
        const hit = articles[i];
        
        try {
            if (hit.attribs.id.slice(0, 5) !== 'post_') throw new Error('Unknown article element found');
        } catch (err: any) {
            console.warn(err.message, err);
            continue;
        }
        ids[i] = hit.attribs['data-id'];
    }

    if (ids.length !== articles.length) console.warn('Missed one or more post ids\n');

    return ids;
}

/**
 * 
 * @param ids array of post ids
 * @returns array with elements of the form ['/post/\<post_id\>', data]
 */
const fetch_post_pages = async (ids: string[]) => {
    const reqs = [];

    for (let i = 0; i < ids.length; i++) {
        reqs[i] = axios.get(`${POST_URL}/${ids[i]}`);
    }

    const res_html: [string, string][] = [];
    (await Promise.all(reqs)).forEach((res, i) => res_html[i] = [(res.request.path).slice(7), res.data]);

    return res_html;
}

/**
 * 
 * @param raw_html array of [post path, post page]
 * @returns array of [post path, cdn endpoints]
 */
const parse_file_urls = (raw_html: [string, string][]) => {
    const urls: [string, string][] = [];

    for (let i = 0; i < raw_html.length; i++) {
        const $ = cheerio.load(raw_html[i][1]);
        const prop = $('#content').children('section').attr('data-file-url');

        if (prop) urls.push([raw_html[i][0], prop]);
    }

    if (urls.length !== raw_html.length) console.warn('Missed one or more images');

    return urls;
}

/**
 * 
 * @param urls array of urls
 * @returns void
 */
const fetch_files = async (urls: [string, string][]) => {

    // const res = await axios.get(urls[0], {responseType: 'arraybuffer'});

    const reqs: any[] = [];
    for (let i = 0; i < urls.length; i++) {
        reqs[i] = axios.get(urls[i][1], {responseType: 'arraybuffer'})
    }

    let write_to_disk: Promise<any>[] = [];

    (await Promise.all(Object.values(reqs))).forEach((res: any, i, arr) => {
        const path = './output/' + urls[i][0] + res.request.path.slice(-4);
        write_to_disk.push(fs.promises.writeFile(path, res.data));
    })

    await Promise.all(write_to_disk);
}

let main = async () => {
    let results_page: any;
    let current_page = 1;

    while (contentful_page) {
        console.log('Fetching images from page', current_page);
        
        results_page = await fetch_results_page(current_page);      
        
        const post_ids = fetch_post_ids(results_page.data)

        const post_pages = await fetch_post_pages(post_ids);
        
        const file_urls = parse_file_urls(post_pages);

        const dir = './output';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        await fetch_files(file_urls);

        current_page++;
    }

    console.log('Bai bai!');
    process.exit(0);
}

main();