import { fetchJson } from "./serverActions";

export default class BiliBiliUtils {
    static async getPagesA(aid: string) {
        const res = await fetchJson("https://api.bilibili.com/x/web-interface/view?aid=" + aid);
        return await this.getPageR(res);
    }

    static async getPages(bvid: string) {
        const res = await fetchJson("https://api.bilibili.com/x/web-interface/view?bvid=" + bvid);
        return await this.getPageR(res);
    }

    private static appendStaticTags(list: any[], tags: string[]) {
        for (let i in list) {
            list[i].static_tags = list[i].static_tags.concat(tags);
        }
        return list;
    }

    static async getPageR(res: any) {
        if (typeof res == "string") return res;
        if (res.code != 0) return res.message;
        let re = [];
        re.push({
            title: res.data.pages.length == 1 ? res.data.title : res.data.title + "/" + res.data.pages[0].part,
            author: res.data.owner.name,
            inner_id: "B" + res.data.bvid,
            static_tags: ["BiliBili", res.data.owner.name].concat(res.data.pages.length == 1 ? [] : ["多p"]),
            tags: [],
            likes: 0
        });
        for (let i = 2; i <= res.data.pages.length; i++) {
            re.push({
                title: res.data.title + "/" + res.data.pages[i - 1].part,
                author: res.data.owner.name,
                inner_id: "B" + res.data.bvid + "_" + i,
                static_tags: ["BiliBili", res.data.owner.name, "多p"],
                tags: [],
                likes: 0
            });
        }
        return re;
    }

    static async getSeries(id: string) {
        const res = await fetchJson("https://api.bilibili.com/x/series/series?series_id=" + id);
        if (typeof res == "string") return res;
        if (res.code != 0) return res.message;
        let re: any[] = [], ids = res.data.recent_aids;
        for (let i in ids) {
            let k = ids[i];
            let v = await this.getPagesA(k);
            if (typeof v == "string") return v;
            re = re.concat(v);
        }
        return this.appendStaticTags(re, [res.data.meta.name]);
    }

    static async getCollections(id: string) {
        let res = await fetchJson("https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=0&season_id=" + id);
        if (typeof res == "string") return res;
        if (res.code != 0) return res.message;
        let aid_first = res.data.aids[0];
        res = await fetchJson("https://api.bilibili.com/x/web-interface/view?aid=" + aid_first);
        if (typeof res == "string") return res;
        if (res.code != 0) return res.message;

        let sections = res.data.ugc_season.sections;
        let title = res.data.ugc_season.title;

        let re = [];

        for (let i in sections) {
            let k = sections[i];
            let title_r = title + "/" + k.title;
            let episodes = k.episodes;
            for (let j in episodes) {
                let l = episodes[j];
                re.push({
                    title: title_r + "/" + l.title,
                    author: res.data.owner.name,
                    inner_id: "B" + l.bvid,
                    static_tags: ["BiliBili", res.data.owner.name, title, k.title],
                    tags: [],
                    likes: 0
                });
            }
        }

        return re;
    }

    static async getFavlist(id: string) {
        let medias_a: any[] = [];
        let medias: any[] = [];
        let n = 1;

        while (medias != null) {
            medias_a = medias_a.concat(medias);
            let res = await fetchJson(`https://api.bilibili.com/x/v3/fav/resource/list?ps=20&media_id=${id}&pn=${n}`);
            if (typeof res == "string") return res;
            if (res.code != 0) return res.message;

            n++;
            medias = res.data.medias;
        }

        let re: any[] = [];
        for (let i in medias_a) {
            if (medias_a[i].page > 1) {
                let v = await this.getPages(medias_a[i].bvid);
                if (typeof v == "string") return v;
                re = re.concat(v);
            } else {
                re.push({
                    title: medias_a[i].title,
                    author: medias_a[i].upper.name,
                    inner_id: "B" + medias_a[i].bvid,
                    static_tags: ["BiliBili", medias_a[i].upper.name],
                    tags: [],
                    likes: 0
                });
            }
        }

        return re;
    }
}