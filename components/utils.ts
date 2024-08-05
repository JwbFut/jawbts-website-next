export default class Utils {
    static escapeDescription(s: string) {
        return s.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(/(?<!\\)\\n/g, "<br />")
    }
}