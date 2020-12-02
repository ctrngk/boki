import axios from "axios";
import {zipObject} from "./zipObject";
import {evalCard, evalDoubleCurly} from "./handleDoubleCurly";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

async function createTopicDeck(deckName) {
    const topicName = 'anki_imported'
    const response = await axios.get(`${SERVER_BASE_URL}/topics?title=${topicName}`)
    const topic = response.data
    let topicID
    if (topic.length === 0) {
        const response = await axios.post(`${SERVER_BASE_URL}/topics/`, {
            title: topicName
        })
        topicID = Number(response.data.id)
    } else {
        topicID = Number(topic[0].id)
    }
    const deckRes = await axios.get(`${SERVER_BASE_URL}/decks?title=${deckName}`)
    const deck = deckRes.data
    let deckID
    if (deck.length === 0) {
        const response = await axios.post(`${SERVER_BASE_URL}/decks/`, {
            title: deckName,
            topic: topicID
        })
        deckID = Number(response.data.id)
    } else {
        deckID = Number(deck[0].id)
    }
    return deckID
}

function clientReplaceSrcWithBase64(html, src2Base64Dict) {
    const elem = document.createElement("div")
    elem.innerHTML = html
    let elements = elem.querySelectorAll("img")
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].src) {
            let src = elements[i].src
            if (src.startsWith("http")) {
                const segments = new URL(src).pathname.split('/');
                src = segments.pop() || segments.pop(); // Handle potential trailing slash
            }
            const base64content = src2Base64Dict[src]
            elements[i].src = `data:image/jpeg;base64,${base64content}`
        }
    }
    return elem.innerHTML
}


export async function clientImportAPKG(zipFiles) {

    const media = zipFiles.media
    const mediaObj = JSON.parse(zipFiles.media) // {0: *.jpg}
    let src2Base64Dict = {}
    for (const number of Object.keys(mediaObj)) {
        const src = mediaObj[number]
        const base64: string = zipFiles[number]
        src2Base64Dict[src] = base64
    }

    const deckName = zipFiles.deckName
    const deckID = await createTopicDeck(deckName)

    // @ts-ignore
    const SQL = await window.initSqlJs({})
    // var db = new SQL.Database(new Uint8Array(zipFiles["sqlite3"]))
    console.log({"sqlite3": zipFiles["sqlite3"]})
    var db = new SQL.Database(zipFiles["sqlite3"])
    let sqlModels = `SELECT models FROM col`
    let sql = `SELECT tags, flds, mid FROM notes`
    var res = db.exec(sqlModels)
    const models = JSON.parse(res[0].values[0][0])
    const results = await db.exec(sql)
    const rows = results[0].values
    for (const row of rows) {
        const tags = row[0]
        const content = row[1]
        const mid = row[2]
        // tmpls {
        //     qfmt {{cloze:Text}}
        //     afmt {{cloze:Text}}{{Extra}}
        // }
        //     flds: [
        //         {"name": "Text"},
        //         {"name: "Extra"}
        //     ]
        // *****************************************
        //     tmpls {
        //         qfmt {{Front}}
        //         afmt {{FrontSide}}{{Back}}
        //     }
        //         flds: [
        //             {"name": "Front"},
        //             {"name: "Back"}
        //         ]
        // ***************************************
        //         flds: [
        //             {" name": "Name"},
        //             {"name":"Capital"},
        //             {"name":"Map"}
        //         ]
        //         "tmpls: [
        //         {
        //             "name": "Map",
        //             "qfmt": "{{Map}}",
        //              "afmt": "{{FrontSide}}{{Name}}"
        // }]
        const varkeyContent = zipObject(
            models[mid].flds.map(x => x.name),
            content.split("")
        )
        // { "MAP": "good", "front": "test", "name": "hello"}
        let originalFront = models[mid].tmpls[0].qfmt
        let originalBack = models[mid].tmpls[0].afmt
        let front, back
        if (originalFront.includes("cloze:")) {
            front = evalCard("front", originalFront, varkeyContent)
            back = evalCard("back", originalBack, varkeyContent)
        } else {
            front = evalDoubleCurly(originalFront, varkeyContent)
            back = evalDoubleCurly(originalBack, varkeyContent)
            back = evalDoubleCurly(back, {"FrontSide": ""})
        }

        front = clientReplaceSrcWithBase64(front, src2Base64Dict)
        back = clientReplaceSrcWithBase64(back, src2Base64Dict)

        const newCard = {
            front: {"html": front},
            back: {"html": back},
            description: {"html": tags},
            deck: deckID
        }
        await axios.post(`${SERVER_BASE_URL}/cards`, newCard)
    }
}
