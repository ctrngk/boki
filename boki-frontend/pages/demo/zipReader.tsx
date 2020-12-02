import Link from "next/link";
import Head from 'next/head';
import React, {useState} from "react";
import JSZip from 'jszip'
import {zipObject} from "../../utils/zipObject"
import {evalCard, evalDoubleCurly} from "../../utils/handleDoubleCurly"
import axios from "axios"
import {clientImportAPKG} from '../../utils/clientImportAPKG'


const App = () => {
    const [content, setContent] = useState([])
    const [mediaContent, setMediaContent] = useState("")

    const handleChangeFile = (file) => {
        const deckName = file.name
        let zip = new JSZip()
        zip.loadAsync(file /* = file blob */)
            .then(function (zip) {
                // process ZIP file content here
                const {files} = zip
                const names = Object.keys(files)
                    .map(key => files[key].name)
                    .filter(name => name !== "media")
                    .filter(name => name !== "collection.anki2")

                const promises = []

                names.forEach(name => {
                    promises.push(zip.file(name).async("base64"))
                })
                promises.push(zip.file("media").async("string"))
                promises.push(zip.file("collection.anki2").async("uint8array"))
                let zipFiles = {}
                Promise.all(promises).then(function (data) {
                    let keys = Object.keys(data)
                    zipFiles["sqlite3"] = data[keys.pop()]
                    zipFiles["media"] = data[keys.pop()]
                    while (keys.length > 0) {
                        const key = keys.pop()
                        zipFiles[key] = data[key]
                    }
                    zipFiles["deckName"] = deckName
                    clientImportAPKG(zipFiles)
                })

            }, function () {
                alert("Not a valid zip file")
            })
    }

    return (
        <>
            <Head>
                <script type="text/javascript" src="/sql-asm.js"/>
                <title>zipReader</title>
            </Head>
            <Link href="/"><a>HOME</a></Link>
            <h1>Zip Reader</h1>
            <div>
                <input type="file" onChange={e =>
                    handleChangeFile(e.target.files[0])}/>
            </div>
        </>
    )

}

export default App