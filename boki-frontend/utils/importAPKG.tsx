import fs from "fs";
import axios from "axios";
import assert from "assert";
import {
    evalCard,
    evalDoubleCurly,
    findDoubleCurly,
    findDoubleCurlyReplace,
} from "./handleDoubleCurly";

const jsdom = require("jsdom")
const {JSDOM} = jsdom
import fse from 'fs-extra'
import {zipObject} from './zipObject'
const StreamZip = require('node-stream-zip');

const initSqlJs = require('sql.js');


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

function replaceSrcWithBase64(html, src2Base64Dict) {
    // const dom = new JSDOM(row.content)
    const dom = new JSDOM(html)
    let elements = dom.window.document.querySelectorAll("img")
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].src) {
            const src = elements[i].src
            const base64content = src2Base64Dict[src]
            elements[i].src = `data:image/jpeg;base64,${base64content}`
        }
    }
    return dom.serialize()
}

export async function parseAPKG(zipFiles) {
    const mediaObj = JSON.parse(zipFiles.media) // 0: *.jpg
    let src2Base64Dict = {}
    for (const number of Object.keys(mediaObj)) {
        const src = mediaObj[number]
        const base64: string = zipFiles[number]
        src2Base64Dict[src] = base64
    }


    const deckName = zipFiles.deckName
    const deckID = await createTopicDeck(deckName)

    const SQL = await initSqlJs({})
    var db = new SQL.Database(new Uint8Array(zipFiles["sqlite3"]))
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

        front = replaceSrcWithBase64(front, src2Base64Dict)
        back = replaceSrcWithBase64(back, src2Base64Dict)

        const newCard = {
            front: {"html": front},
            back: {"html": back},
            description: {"html": tags},
            deck: deckID
        }
        await axios.post(`${SERVER_BASE_URL}/cards`, newCard)
    }
}

export async function importAPKG(file, deckName: string) {
    const zip = new StreamZip({
        file: file.path,
        storeEntries: true
    });
    let zipFiles = {}
    zip.on('ready', async () => {
        // Take a look at the files
        // console.log('Entries read: ' + zip.entriesCount)
        // console.log({zip})
        for (const entry of Object.values(zip.entries())) {
            // const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
            // console.log(`Entry ${entry.name}: ${desc}`);
            // @ts-ignore
            if (entry.name === 'collection.anki2') {
                zipFiles["sqlite3"] = zip.entryDataSync(entry).toString("binary")
                zipFiles["sqlite3"] = zip.entryDataSync(entry)
                // @ts-ignore
            } else if (entry.name === 'media') {
                zipFiles["media"] = zip.entryDataSync(entry).toString("utf-8")
            } else {
                // @ts-ignore
                zipFiles[entry.name] = zip.entryDataSync(entry).toString('base64')
            }
        }
        zipFiles["deckName"] = deckName
        await parseAPKG(zipFiles)
        zip.close()
    });





    // await extract(file.path, { dir: `/tmp/apkg/${file.name}` })
    // const mediaObj = await fse.readJson(`/tmp/apkg/${file.name}/media`)
    //
    // const deckName = file.name.split('.')[0]
    // const deckID = await createTopicDeck(deckName)
    //
    // let db = new sqlite3.Database(`/tmp/apkg/${file.name}/collection.anki2`)
    // // https://gist.github.com/yizhang82/26101c92faeea19568e48224b09e2d1c
    // db.getAsync = function (sql) {
    //     var that = this;
    //     return new Promise(function (resolve, reject) {
    //         that.get(sql, function (err, row) {
    //             if (err)
    //                 reject(err);
    //             else
    //                 resolve(row);
    //         });
    //     });
    // }
    // db.allAsync = function (sql) {
    //     var that = this;
    //     return new Promise(function (resolve, reject) {
    //         that.all(sql, function (err, rows) {
    //             if (err)
    //                 reject(err);
    //             else
    //                 resolve(rows);
    //         });
    //     });
    // }
    //
    // let sql = `SELECT tags tags, flds content, mid mid FROM notes`
    // let sqlModels = `SELECT models FROM col`
    // const rowModel = await db.getAsync(sqlModels)
    // const models = JSON.parse(rowModel.models)
    // const rows = await db.allAsync(sql)
    // for (const row of rows) {
    //     // tmpls {
    //     //     qfmt {{cloze:Text}}
    //     //     afmt {{cloze:Text}}{{Extra}}
    //     // }
    //     //     flds: [
    //     //         {"name": "Text"},
    //     //         {"name: "Extra"}
    //     //     ]
    //     // *****************************************
    //     //     tmpls {
    //     //         qfmt {{Front}}
    //     //         afmt {{FrontSide}}{{Back}}
    //     //     }
    //     //         flds: [
    //     //             {"name": "Front"},
    //     //             {"name: "Back"}
    //     //         ]
    //     // ***************************************
    //     //         flds: [
    //     //             {" name": "Name"},
    //     //             {"name":"Capital"},
    //     //             {"name":"Map"}
    //     //         ]
    //     //         "tmpls: [
    //     //         {
    //     //             "name": "Map",
    //     //             "qfmt": "{{Map}}",
    //     //              "afmt": "{{FrontSide}}{{Name}}"
    //     // }]
    //     const varkeyContent = zipObject(
    //         models[row.mid].flds.map(x => x.name),
    //         row.content.split("")
    //     )
    //     // { "MAP": "good", "front": "test", "name": "hello"}
    //     let originalFront = models[row.mid].tmpls[0].qfmt
    //     let originalBack = models[row.mid].tmpls[0].afmt
    //     let front, back
    //     if (originalFront.includes("cloze:")) {
    //         front = evalCard("front", originalFront, varkeyContent)
    //         back = evalCard("back", originalBack, varkeyContent)
    //     } else {
    //         front = evalDoubleCurly(originalFront, varkeyContent)
    //         back = evalDoubleCurly(originalBack, varkeyContent)
    //         back = evalDoubleCurly(back, {"FrontSide": ""})
    //     }
    //
    //     front = replaceSrcWithBase64(front, mediaObj, file)
    //     back = replaceSrcWithBase64(back, mediaObj, file)
    //
    //     const newCard = {
    //         front: {"html": front},
    //         back: {"html": back},
    //         description: {"html": row.tags},
    //         deck: deckID
    //     }
    //     await axios.post(`${SERVER_BASE_URL}/cards`, newCard)
    // }
    //
    // try {
    //     fs.rmdirSync('/tmp/apkg', { recursive: true });
    //     console.log(`/tmp/apkg is deleted!`);
    // } catch (err) {
    //     console.error(`Error while deleting /tmp/apkg`);
    // }
    //

}