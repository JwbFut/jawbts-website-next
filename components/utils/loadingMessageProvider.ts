export default class LoadingMessageProvider {
    static randomChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?".split("");
    messages: string[];
    stage: number;
    time: number;
    random_char_time: number;
    waiting_time: number;

    constructor(messages: string[]) {
        this.messages = messages;
        this.time = 0;
        this.stage = -1;
        this.random_char_time = 0;
        this.waiting_time = 0;
    }

    getMessage(): string {
        this.random_char_time += 1;
        if (this.waiting_time > 0) {
            this.waiting_time -= 1;

            if (this.waiting_time == 0) {
                this.stage += 1;
                this.stage %= this.messages.length;
                this.random_char_time = 0;
                this.time = 0;
            } else {
                return this.messages[this.stage];
            }
        }

        if (this.stage == -1 && this.random_char_time <= 25) return "";
        if (this.stage == -1) {
            this.stage = 0;
            this.random_char_time = 0;
        }

        if (this.random_char_time > Math.random() * 6) {
            this.random_char_time = 0;
            this.time += 1;
        }

        if (this.time > this.messages[this.stage].length) {
            this.waiting_time = 25;
        }

        let mes = this.messages[this.stage].substring(0, this.time);
        return mes + LoadingMessageProvider.randomChars[Math.floor(Math.random() * LoadingMessageProvider.randomChars.length)];
    }
}