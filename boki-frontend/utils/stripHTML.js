// https://stackoverflow.com/a/47140708/6710360
function stripHTML(html) {
    if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        // browser
        let doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    } else {
        return ''
    }
}

export default stripHTML