// const jsdom = require("jsdom");
// const { JSDOM } = jsdom

// https://gist.github.com/Paradoxis/14997049256dd01c5b36fc11a06fe9cf
// Find and replace double curly braces in JavaScript, example:
// findReplace("Hello, {{ name }}", "name", "John"); // "Hello, John"
export function findDoubleCurlyReplace(original: string, placeholder: string, replacement: string): string {
        return original.replace(new RegExp('{{(?:\\s+)?(' + placeholder + ')(?:\\s+)?}}'), replacement);
}

export function findDoubleCurly(original): string[] {
    // afmt {{FrontSide}}\n\n<div id=\"answer\">\n\t<hr>\n\t{{Name}}\n</div>
    // https://stackoverflow.com/a/61999284/6710360
    const re = /{{(.*?)}}/g
    let listOfText = [];
    let found
    while (found = re.exec(original)) {
        listOfText.push(found[1].trim())
    }
    return listOfText
}

export function findFirstDoubleCurly(original): string {
    return findDoubleCurly(original)[0]
}


export function evalDoubleCurly(fmt: string, keyValueObject: { [key: string]: string }): string {
    // fmt: <div>{{Map}} {{Front}}<div>
    // keyValueObject: {
    //      Map: "good",
    //      Front: "test",
    //  }
    let result = fmt
    let placeholders: string[] = findDoubleCurly(fmt)
    placeholders.forEach(placeholder => {
        const replacement = keyValueObject[placeholder]
        if (replacement || replacement === "") {
            result = findDoubleCurlyReplace(result, placeholder, replacement)
        }
    })
    return result

}

export function removeCloze(valueArray: string[]) {
    // ["cloze: TTTT ", "cloze: GGGG"] => ["TTTT", "GGGG"]
    return valueArray.map(value => value.split("cloze:")[1].trim())
}

export function evalCard(state = "front", original: string, keyValueObject: { [key: string]: string }): string {
    if (state === "front") {
        let result = original
        // result => {{cloze:TTTTTT}} {{ Extra }}
        result = evalDoubleCurly(result, keyValueObject)
        // result => {{cloze:TTTTTT}} kkk
        let regex = /{{cloze:\s*(.*?)\s*}}/
        while (regex.test(result)) {
            const variable: string = result.match(regex)[1]
            result = result.replace(regex, `{{${variable}}}`)
        }
        // result => {{TTTTTT}} kkk
        result = evalDoubleCurly(result, keyValueObject)
        // result => A{{c1::60s}} B {{c2::<b><i>40s::hints</i></b>}} CC {{c1::50s::h}}kkk
        regex = /{{\s*(.+?)\s*?}}/
        while (regex.test(result)) {
            const v: string = result.match(regex)[1]
            // v => "c1::60s", "c2::<b><i>40s::hints</i></b>", "c1::50s::h"
            let [first, ...rest] = v.split('::')
            let r: string = rest.join('::')
            // r => "60s", "<b><i>40s::hints</i></b>", "50s::h"
            if (r.includes("::")) {
                const elem = document.createElement("div")
                elem.innerHTML = r
                const text = elem.textContent
                // const dom = new JSDOM(r) // <b><i><b>40s</b>::hints</i></b>
                // const text = dom.window.document.body.textContent // 40s::hints
                const toBeRemoved = text.split("::")[0]
                r = r.replace(toBeRemoved, "") // <b><i>hints</i></b>
                r = r.replace("::", "")
                result = result.replace(regex, `__[hint:]${r}__`)
            } else {
                result = result.replace(regex, `____`)
            }
        }
        return result
    } else {
        let result = original
        // result => J{{cloze:TTTTT}}{{Extra}}K {{cloze: UUUU}} L
        result = evalDoubleCurly(result, keyValueObject)
        // result => J{{cloze:TTTTT}} KKKKK {{cloze: UUUU}} L
        let regex = /{{cloze:\s*(.*?)\s*}}/
        while (regex.test(result)) {
            const variable: string = result.match(regex)[1]
            result = result.replace(regex, `{{${variable}}}`)
        }
        // result => J{{TTTTT}} KKKKK {{UUUU}} L
        // keyValueObject => {TTTTT: A{{c1::60s}}B {{c1::50s}} C, UUUU:...}
        result = evalDoubleCurly(result, keyValueObject)
        // result => J A{{c1::60s}}B {{c1::50s}} C KKKKK {{c2::40s::h}} L
        regex = /{{\s*(.+?)\s*?}}/
        while (regex.test(result)) {
            const v: string = result.match(regex)[1]
            // v => "c1::60s", "c2::<b><i>40s::hints</i></b>", "c1::50s::h"
            let [first, ...rest] = v.split('::')
            let r: string = rest.join('::')
            // r => "60s", "<b><i>40s::hints</i></b>", "50s::h"
            if (r.includes("::")) {
                const elem = document.createElement("div")
                elem.innerHTML = r
                const text = elem.textContent
                // const dom = new JSDOM(r) // <b><i>40s::hints</i></b>
                // const text = dom.window.document.body.textContent // 40s::hints
                const toBeRemoved = text.split("::")[1] // hints
                r = r.replace(toBeRemoved, "") // <b><i>40s::</i></b>
                r = r.replace("::", "")
                result = result.replace(regex, r)
            } else {
                result = result.replace(regex, r)
            }
        }
        // // // result => J A 60s B 50s C KKKKK 40s L
        return result
    }
}

