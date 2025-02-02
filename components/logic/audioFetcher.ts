"use client"

const MP4Box = require("mp4box");

const BLOCK_SIZE = 500000; // true block size will be close to this (depends on the size of segments)
const MAX_FETCH_WORKERS = 2;
const MAX_FRAGMENT_FORWARD = 5;
const INIT_FETCH_SIZE = 300000; // maybe enough for the necessary boxes
const MAX_CONTINUOUS_FAILURES = 10;
const FETCH_TIMEOUT = 5000; // 5s

const DEV_MODE = false;

export interface FetcheFragment {
    start: number; // included
    end: number; // excluded
    buffer_cache: ArrayBuffer | null; // cache, need to be removed unless any previous fragment is jumped
    ready: boolean; // if the fragment is ready (fetched)
    fetching: boolean; // if the fragment is fetching now
    appended: boolean; // if the fragment is appended to sourceBuffer
    relatedReferenceIndex: number[];
    neverDrop: boolean; // if the fragment should never be dropped (not aligned with the segment)
    mustFetch: boolean; // if the fragment should be fetched first (not aligned with the segment)
}

export interface FragmentReference {
    start: number; // alreay added the data offset
    end: number;
    duration_start: number; // sec
    duration_end: number; // sec
}

export default class AudioFetcher {
    private src: string = "";
    private ticking: boolean = false;
    private bitLength: number | null = null; // last byte excluded
    private fragments: FetcheFragment[] = [];
    private mediaSource: MediaSource = new MediaSource();
    private mediaSourceOpened: boolean = false;
    private blobUrl: string | null = null;
    private sourceBuffer: SourceBuffer | null = null;
    private failed: boolean = false;
    private fetchWorkerCount: number = 0;
    private mp4boxFile: any = null; // MP4Box.createFile();
    private duration: number | null = null; //sec
    private timescale: number | null = null;
    private dataOffset: number | null = null; // byte, start of first moof box
    private fragmentsReference: FragmentReference[] = [];
    private needChangeSrc: string | null = null;
    private blobUrlChangeCallback: ((url: string) => void) | null = null;
    private continuousFailures: number = 0;
    private _curTime: number = 0; //sec
    public curTime: number = 0; //sec

    constructor() {
        if (DEV_MODE) console.log(this);
    }

    getBlobUrl(): string | null {
        return this.blobUrl;
    }

    setSrc(src: string): void {
        this.needChangeSrc = src;
    }

    setFailed() {
        this.failed = true;
    }

    isFailed() {
        return this.failed;
    }

    getBuffered() {
        if (!this.sourceBuffer) throw new Error("sourceBuffer not created");
        return this.sourceBuffer.buffered;
    }

    setBlobUrlChangeCallback(callback: (url: string) => void) {
        this.blobUrlChangeCallback = callback;
    }

    getSrc(): string {
        return this.src;
    }

    /**
     * need to be called periodically to fetch audio data.
     */
    async tick(): Promise<void> {
        if (this.ticking) return;
        this.ticking = true;
        try {
            await this._tick();
        } finally {
            this.ticking = false;
        }
    }

    // will reset mp4boxFile
    private async createSourceBuffer(fetchedBuffer: ArrayBuffer): Promise<void> {
        if (!this.mediaSourceOpened || this.sourceBuffer) throw new Error("sourceBuffer already created or mediaSource not opened");

        this.mp4boxFile = MP4Box.createFile();
        (fetchedBuffer as any).fileStart = 0;

        return new Promise((resolve, reject) => {
            this.mp4boxFile.onReady = (info: any) => {
                if (!info.mime) {
                    reject(new Error("Invalid MP4 file: MIME type not found"));
                    return;
                }
                if (!MediaSource.isTypeSupported(info.mime)) {
                    reject(new Error(`Unsupported MIME type: ${info.mime}`));
                    return;
                }

                this.sourceBuffer = this.mediaSource.addSourceBuffer(info.mime);
                resolve();
            };

            this.mp4boxFile.onError = (e: any) => {
                console.error("MP4Box error", e);
                reject(new Error(`MP4Box error: ${e}`));
            };

            this.mp4boxFile.appendBuffer(fetchedBuffer);
        });
    }

    private appendBufferAsync(chunk: ArrayBuffer) {
        if (!this.sourceBuffer) throw new Error("sourceBuffer not created");
        return new Promise((resolve, reject) => {
            if (!this.sourceBuffer) throw new Error("sourceBuffer not created");
            this.sourceBuffer.addEventListener('updateend', resolve, { once: true });
            this.sourceBuffer.addEventListener('error', reject, { once: true });
            this.sourceBuffer.appendBuffer(chunk);
        });
    }

    private removeBufferAsync(fragIndex: number) {
        this.fragments[fragIndex].relatedReferenceIndex.sort((a, b) => a - b);
        const l = this.fragmentsReference[this.fragments[fragIndex].relatedReferenceIndex[0]].duration_start;
        const r = this.fragmentsReference[this.fragments[fragIndex].relatedReferenceIndex[this.fragments[fragIndex].relatedReferenceIndex.length - 1]].duration_end;

        return new Promise((resolve, reject) => {
            if (!this.sourceBuffer) throw new Error("sourceBuffer not created");
            this.sourceBuffer.addEventListener('updateend', resolve, { once: true });
            this.sourceBuffer.addEventListener('error', reject, { once: true });
            this.sourceBuffer.remove(l, r);
        });
    }

    private async _tick() {
        if (this.needChangeSrc) {
            await this.onSrcChange();
            this.src = this.needChangeSrc;
            this.needChangeSrc = null;
        }

        if (this.duration && this.curTime >= this.duration) return; // already ended
        this._curTime = this.curTime;

        if (this.failed) throw new Error("already failed");
        if ((this.duration && this._curTime > this.duration) || this._curTime < 0) throw new Error("invalid curTime");
        if (!this.mediaSourceOpened) return; // wait for next tick
        this.duration = this.mediaSource.duration;

        if (!this.bitLength) {
            // init fetch

            let fetchedBuffer;
            try {
                fetchedBuffer = await this.fetchRange(0, INIT_FETCH_SIZE);
            } catch (e) {
                if ((e as Error).message.includes("fetch failed")) return;
                console.error(e);
                return;
            }
            if (!this.bitLength) throw new Error("bitLength not set"); // should never happen

            try {
                await this.createSourceBuffer(fetchedBuffer);
            } catch (error) {
                console.error("Failed to create SourceBuffer:", error);
                this.failed = true;
                return;
            }

            if (!this.mp4boxFile.sidx) {
                this.failed = true;
                throw new Error("sidx not found");
            }
            this.timescale = this.mp4boxFile.sidx.timescale;
            this.dataOffset = this.mp4boxFile.sidx.start + this.mp4boxFile.sidx.size;

            if (!this.timescale) {
                this.failed = true;
                throw new Error("timescale not found");
            }
            if (!this.dataOffset) {
                this.failed = true;
                throw new Error("side start or size not found");
            }

            let k3 = this.dataOffset, k4 = 0;
            for (let i = 0; i < this.mp4boxFile.sidx.references.length; i++) {
                const ref = this.mp4boxFile.sidx.references[i];
                this.fragmentsReference.push({
                    start: k3,
                    end: k3 + ref.referenced_size,
                    duration_start: k4 / this.timescale,
                    duration_end: (k4 + ref.subsegment_duration) / this.timescale
                });
                k3 += ref.referenced_size;
                k4 += ref.subsegment_duration;
            }

            let k1 = INIT_FETCH_SIZE;
            // first, init fetch, end not aligned with reference
            this.fragments.push({
                start: 0,
                end: Math.min(INIT_FETCH_SIZE, this.bitLength),
                buffer_cache: null,
                ready: false,
                fetching: false,
                appended: false,
                relatedReferenceIndex: [],
                neverDrop: true,
                mustFetch: true
            });
            let i = 0, kFrag = 0;
            for (; i < this.mp4boxFile.sidx.references.length; i++) {
                if (this.fragmentsReference[i].end >= k1) break;
            }
            let accumulateSize = 0, relatedReferenceIndex: number[] = [];
            for (; i < this.fragmentsReference.length; i++) {
                const ref = this.fragmentsReference[i];
                accumulateSize += ref.end - ref.start;
                relatedReferenceIndex.push(i);
                if (accumulateSize >= BLOCK_SIZE || i === this.fragmentsReference.length - 1 || kFrag == 0) {
                    kFrag++;
                    accumulateSize = 0;
                    this.fragments.push({
                        start: k1,
                        end: ref.end,
                        buffer_cache: null,
                        ready: false,
                        fetching: false,
                        appended: false,
                        relatedReferenceIndex: relatedReferenceIndex.slice(),
                        neverDrop: kFrag <= 1, // first and second are not aligned with the reference, dont drop them
                        mustFetch: kFrag <= 1 // first and second are not aligned with the reference, fetch them first
                    });
                    relatedReferenceIndex = [];
                    k1 = ref.end;
                }
            }

            if (!this.sourceBuffer) throw new Error("sourceBuffer not created"); // should never happen
            await this.appendBufferAsync(fetchedBuffer.slice());

            this.fragments[0].ready = true;
            this.fragments[0].appended = true;
            return;
        }

        if (!this.sourceBuffer) throw new Error("sourceBuffer not created"); // should never happen

        // calculate needed fragment
        let fragRefIndex;
        for (let i = 0; i < this.fragmentsReference.length; i++) {
            const ref = this.fragmentsReference[i];
            if (ref.duration_start <= this._curTime && ref.duration_end >= this._curTime) {
                fragRefIndex = i;
                break;
            }
        }
        if (DEV_MODE) console.log(`fragRefIndex: ${fragRefIndex}`);
        if (fragRefIndex == null) { // on end or on start
            if (this.curTime > this.duration - this.curTime) fragRefIndex = this.fragmentsReference.length - 1;
            else fragRefIndex = 0;
        }
        let fragIndex;
        for (let i = 0; i < this.fragments.length; i++) {
            const frag = this.fragments[i];
            if (this.fragmentsReference[fragRefIndex].start <= frag.end && this.fragmentsReference[fragRefIndex].end >= frag.start) {
                fragIndex = i;
                break;
            }
        }
        if (DEV_MODE) console.log(`fragIndex: ${fragIndex}`);
        if (fragIndex == null) throw new Error("invalid fragIndex"); // should never happen

        const fragIndexEnd = Math.min(fragIndex + MAX_FRAGMENT_FORWARD, this.fragments.length - 1);

        let needFetchIndex: number[] = [];
        let needFetchNotComplete: boolean = false;
        for (let i = fragIndex; i <= fragIndexEnd; i++) needFetchIndex.push(i);
        for (let i = 0; i < this.fragments.length; i++) {
            if (!this.fragments[i].appended && this.fragments[i].mustFetch && !needFetchIndex.includes(i)) {
                needFetchIndex.push(i);
                needFetchNotComplete = true;
            }
        }

        for (let i = 0; i < needFetchIndex.length; i++) {
            const frag = this.fragments[needFetchIndex[i]];
            if (frag.ready || frag.fetching || frag.buffer_cache) continue;
            if (this.fetchWorkerCount >= MAX_FETCH_WORKERS) break;

            frag.fetching = true;
            this.fetchWorkerCount++;
            this.fetchRange(frag.start, frag.end)
                .then((buffer) => {
                    frag.buffer_cache = buffer;
                    this.continuousFailures = 0;
                })
                .catch((error) => {
                    if ((error as Error).message.includes("fetch failed")) {
                        this.continuousFailures++;
                        if (this.continuousFailures >= MAX_CONTINUOUS_FAILURES) {
                            this.failed = true;
                            throw new Error("too many continuous failures");
                        }
                        return;
                    }
                    console.error(error);
                })
                .finally(() => {
                    frag.fetching = false;
                    this.fetchWorkerCount--;
                });
        }

        if (this.sourceBuffer.mode === "segments") {
            // update fragment status
            // jump first and second (thet are not aligned with the reference, dont drop them)
            for (let i = 1; i < this.fragments.length; i++) {
                const frag = this.fragments[i];
                if (!frag.ready && frag.buffer_cache && (!needFetchNotComplete || frag.mustFetch)) {
                    if (DEV_MODE) console.log(`append NO. ${i}`);
                    await this.appendBufferAsync(frag.buffer_cache);
                    frag.appended = true;
                    frag.buffer_cache = null;
                    frag.ready = true;
                }
                if (!frag.neverDrop && frag.ready && (i < fragIndex - MAX_FRAGMENT_FORWARD / 2 || i > fragIndex + MAX_FRAGMENT_FORWARD * 1.5)) {
                    if (DEV_MODE) console.log(`remove NO. ${i}`);
                    await this.removeBufferAsync(i);
                    frag.ready = false;
                    frag.appended = false;
                }
            }
        } else {
            // fuck it
            throw new Error("unsupported mode");
        }
    }

    private async onSrcChange() {
        if (this.blobUrl != null) URL.revokeObjectURL(this.blobUrl);
        if (!this.blobUrlChangeCallback) throw new Error("blobUrlChangeCallback not set");
        this.sourceBuffer = null;
        this.duration = null;
        this.timescale = null;
        this.dataOffset = null;
        this.mp4boxFile = null;
        this.failed = false;
        this.fragments = [];
        this.fragmentsReference = [];
        this._curTime = 0;
        this.bitLength = null;
        this.mediaSource = new MediaSource();
        this.mediaSourceOpened = false;
        this.blobUrl = URL.createObjectURL(this.mediaSource);
        this.blobUrlChangeCallback(this.blobUrl);
        const mediaSourcePromise = new Promise<void>((resolve, reject) => {
            this.mediaSource.addEventListener("sourceopen", () => {
                this.mediaSourceOpened = true;
                resolve();
            }, { once: true });
            this.mediaSource.addEventListener("error", (e) => {
                console.error("media source error", e);
                this.failed = true;
                reject(new Error("media source error"));
            }, { once: true });
        });
        await mediaSourcePromise;
    }

    /**
     * Fetch audio data in the given range.
     * @param rangeL included
     * @param rangeR excluded
     * @returns null if content-range is invalid or content-length is 0 (mayhappen) or the array buffer.
     * @throws a lot of errors, especially fetch failed.
     */
    private async fetchRange(rangeL: number, rangeR: number): Promise<ArrayBuffer> {
        // may OFTEN throw error
        // fetch failed
        const fetchPromise = fetch(this.src + "&timestamp=" + Date.now(), {
            headers: {
                Range: `bytes=${rangeL}-${rangeR - 1}`
            },
            cache: "no-cache"
        });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('fetch failed: Request timed out')), FETCH_TIMEOUT)
        );

        const response = await (Promise.race([fetchPromise, timeoutPromise]) as Promise<Response>);

        if (!response.ok) throw new Error("fetch failed");
        const rangeResponse = response.headers.get("Content-Range");
        if (response.headers.get("Content-Length") == "0") throw new Error("invalid content-range: length = 0 (maybe rate limit reached)");
        if (rangeResponse == null) throw new Error("invalid content-range: did not find range");

        const r = parseInt(rangeResponse.split("/")[0].split("-")[1]);
        if (r !== rangeR - 1) throw new Error("invalid content-range: invalid range (maybe rate limit reached)");

        const totalBytes = parseInt(rangeResponse.split("/")[1]);
        if (!Number.isInteger(totalBytes) || totalBytes <= 0) throw new Error("invalid content-range: invalid total");
        this.bitLength = totalBytes;
        const arrayBuffer = await response.arrayBuffer();

        // console.log(`fetch [${rangeL}-${rangeR}) ${arrayBuffer.byteLength} bytes`);

        return arrayBuffer;
    }
}