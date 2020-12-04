import React from 'react'
import axios from "axios"
import Editor from '../../components/Editor'
import {swapB64Upload, dummyCardCreated} from "../../utils/swapB64Upload";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

function Page() {

    const onCreated = async (deckID: number) => {

        // @ts-ignore
        let data1 = window.editor1.getData() // @ts-ignore
        let data2 = window.editor2.getData() // @ts-ignore
        let data3 = window.editor3.getData() // optional description
        if (!data1 || !data2)
            return

        const cardID = await dummyCardCreated(deckID)
        console.log({cardID})
        console.log({data1})
        console.log({data2})

        data1 = await swapB64Upload(data1, cardID)
        data2 = await swapB64Upload(data2, cardID)
        data3 = await swapB64Upload(data3, cardID)

        const newData = {
            "front": {"html": data1},
            "back": {"html": data2},
            "deck": {"id": deckID},
            "description": {"html": data3}
        }
        const res = await axios.put(
            `${SERVER_BASE_URL}/cards/${cardID}`,
            newData
        )


        // window.location.reload(false)
    }


    return <>
        <h1> Card </h1>
        <>
            <Editor front="" back="" description="" editing={true}/>
        </>
        <button onClick={e => onCreated(9999)}>create</button>
    </>
}


export default Page
