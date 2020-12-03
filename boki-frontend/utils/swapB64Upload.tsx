import React from 'react'
import axios from "axios";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function swapB64Upload(html: string, cardID: string){
    // html === `<div class=\\"map\\"><img src=\\"data:image/jpeg;base64,iVBORw...`
    if (!html.includes("base64")) {
        console.log("no base64 found")
        return html
    }
    const elem = document.createElement("div")
    elem.innerHTML = html
    let image = elem.querySelectorAll("img")
    for (let tag of image) {
        if (tag.src && tag.src.startsWith("data:")) {
            // https://stackoverflow.com/a/36183085/6710360
            const res = await fetch(tag.src) // data:image/jpeg;base64,iVBORw
            const blob = await res.blob()
            const formData = new FormData()
            formData.append("files", blob)
            formData.append('ref', 'card')
            formData.append('refId', cardID)
            formData.append('field', 'media') // media field in card model
            // appending to this card id's media []
            const uploadedInfo = await axios.post(`${SERVER_BASE_URL}/upload/`, formData)
            const {url} = uploadedInfo.data[0]
            tag.src = `${SERVER_BASE_URL}${url}`
        }
    }
    return elem.innerHTML
}

export async function dummyCardCreated(deckID: number) {
    const newData = {
        "front": {"html": "demo"},
        "back": {"html": "demo"},
        "deck": {"id": deckID},
        "description": {"html": "demo"}
    }
    const res = await axios.post(
        `${SERVER_BASE_URL}/cards`,
        newData
    )
    // cardID
    return res.data.id
}



