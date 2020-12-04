import Link from "next/link";
import Head from 'next/head';
import React, {useState} from "react";
import JSZip from 'jszip'
import {zipObject} from "../../utils/zipObject"
import {evalCard, evalDoubleCurly} from "../../utils/handleDoubleCurly"
import axios from "axios"
import {dummyCardCreated, swapB64Upload} from "../../utils/swapB64Upload";
import pProps from 'p-props'

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

async function updateSrc(html: string, fileName_blob: object, cardID: string) {
    const elem = document.createElement("div")
    elem.innerHTML = html
    // https://stackoverflow.com/a/30547087/6710360
    // get all the src
    var srcNodeList = elem.querySelectorAll('[src]')
    for (let tag of srcNodeList) {
        if (tag.tagName.toLowerCase() !== "script" && tag.getAttribute('src')) {
            let src = tag.getAttribute('src')
            if (src.startsWith("http")) {
                const segments = new URL(src).pathname.split('/');
                src = segments.pop() || segments.pop(); // Handle potential trailing slash
            }
            // console.log({src})
            const blob = fileName_blob[src]
            // console.log({blob})
            const formData = new FormData()
            formData.append("files", blob, src)
            formData.append('ref', 'card')
            formData.append('refId', cardID)
            formData.append('field', 'media') // media field in card model
            // appending to this card id's media []
            const uploadedInfo = await axios.post(`${SERVER_BASE_URL}/upload/`, formData)
            const {url} = uploadedInfo.data[0]
            // console.log({url})
            tag.setAttribute('src', `${SERVER_BASE_URL}${url}`)
        }
    }
    return elem.innerHTML
}


export async function clientImportAPKG(zipFiles) {

    const mediaObj = JSON.parse(zipFiles.media) // {0: *.jpg}
    let fileName_blob = {}
    for (const number of Object.keys(mediaObj)) {
        const fileName = mediaObj[number]
        const blob = zipFiles[number]
        fileName_blob[fileName] = blob
    }

    const deckName = zipFiles.deckName
    const deckID = await createTopicDeck(deckName)

    // @ts-ignore
    const SQL = await window.initSqlJs({})
    // var db = new SQL.Database(new Uint8Array(zipFiles["sqlite3"]))
    var db = new SQL.Database(zipFiles["sqlite3"])
    let sqlModels = `SELECT models FROM col`
    let sql = `SELECT tags, flds, mid FROM notes`
    var res = db.exec(sqlModels)
    const models = JSON.parse(res[0].values[0][0])
    const results = await db.exec(sql)
    const rows = results[0].values
    let promises = []
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

        const cardID = await dummyCardCreated(deckID)
        // console.log({cardID})
        // before: <div>hello <img src="hello.jpg" /> world </div>
        // after: <div> hello <img src="CMS://uploads/hello_xxx.jpg" /> world</div>
        // console.log("before front", {front})
        front = await updateSrc(front, fileName_blob, cardID)
        // console.log("after front", {front})
        back = await updateSrc(back, fileName_blob, cardID)

        const newData = {
            front: {"html": front},
            back: {"html": back},
            description: {"html": tags},
            deck: deckID
        }
        promises.push(axios.put(`${SERVER_BASE_URL}/cards/${cardID}`, newData))
    }
    Promise.all(promises).then(function (data) {
        console.log("success")
    })
}

const Page = () => {

    const [loading, setLoading ] = useState(false)

    const handleChangeFile = (file) => {
        setLoading(true)
        const deckName = file.name
        let jszip = new JSZip()
        jszip.loadAsync(file /* = file blob */).then(zip => {
            // process ZIP file content here
            const {files} = zip
            const names = Object.keys(files)
                .map(key => files[key].name)
                .filter(name => name !== "media")
                .filter(name => name !== "collection.anki2")
            let promises = {}
            names.map(name => {
                promises[name] = zip.file(name).async("blob")
            })
            promises["media"] = zip.file("media").async("string")
            promises["sqlite3"] = zip.file("collection.anki2").async("uint8array")
            // https://stackoverflow.com/a/61530774/6710360
            pProps(promises).then(zipFiles => {
                // console.log({zipFiles})
                zipFiles["deckName"] = deckName
                clientImportAPKG(zipFiles).then(res=> {
                    setLoading(false)
                })
            })

        }, (err) => {
            alert("Not a valid zip file")
        })
    }

    return (
        <>
            <Head>
                <script type="text/javascript" src="/sql-asm.js"/>
                <title>GetShared</title>
            </Head>
            <Link href="/"><a>HOME</a></Link>
            <h1>get Anki shared</h1>
            <div>
                <input type="file" onChange={e =>
                    handleChangeFile(e.target.files[0])}
                       disabled={loading}
                />
            </div>
        </>
    )

}

export default Page