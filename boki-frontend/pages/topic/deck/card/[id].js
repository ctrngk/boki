import React, {useEffect, useRef, useState} from "react";
import SimpleBreadcrumbs from '../../../../components/SimpleBreadcurmbs'
import Editor from "../../../../components/Editor";
import axios from "axios";
import formatBytes from "../../../../utils/displaySize";
import stripHTML from "../../../../utils/stripHTML";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL


export async function getServerSideProps(context) {
    const id = Number(context.query.id)

    const res = await fetch(`${SERVER_BASE_URL}/cards/${id}`)
    const response = await res.json()
    const cardTitle = response.description.html || response.id
    const deckTitle = response.deck.title
    const deckID = response.deck.id
    const topicID = response.deck.topic
    const topic_res = await fetch(`${SERVER_BASE_URL}/topics/${topicID}`)
    const topic_response = await topic_res.json()
    const topicTitle = topic_response.title


    const front_card = response.front.html
    const back_card = response.back.html
    const description = response.description.html
    const media = response.media
    return {
        props: {
            front_card,
            back_card,
            description,
            media,
            topicID,
            topicTitle,
            deckID,
            deckTitle,
            cardTitle,
            cardID: id,
        },
    }
}

function CustomBreadcrumbs({dataProps}) {
    const {topicID, deckID, topicTitle, deckTitle, cardID, cardTitle} = dataProps

    return <>
        <SimpleBreadcrumbs crumbs={[
            {"href": "/", "text": "home"},
            {"href": `/topic/${topicID}`, "text": `topic (${topicTitle})`},
            {"href": `/topic/deck/${deckID}`, "text": `deck (${deckTitle})`},
            {"href": `/topic/deck/card/${cardID}`, "text": `card (${stripHTML(cardTitle)})`}
        ]}/>
    </>
}


function Page(dataProps) {
    const {back_card, front_card, description, media} = dataProps
    const {deckID, cardID} = dataProps


    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    const updateItem = async () => {
        const data1 = window.editor1.getData()
        const data2 = window.editor2.getData()
        const data3 = window.editor3.getData() // optional description
        if (!data1 || !data2)
            return
        setEditing(false)
        setLoading(true)
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
        window.location.reload(false)

    }
    const handleDelete = async () => {
        setEditing(false)
        setLoading(true)
        const res = await axios.delete(
            `${SERVER_BASE_URL}/cards/${cardID}`
        )
        window.location.href= '/'
    }

    // ********* upload files***********
    const [selectedFiles, setSelectedFiles] = useState([])

    const onFileChange = e => {
        setSelectedFiles(Array.from(e.target.files))
    }
    const onFileUpload = async () => {
        const formData = new FormData()
        selectedFiles.forEach(selectedFile => {
                formData.append("files", selectedFile, selectedFile.name)
            }
        )
        formData.append('ref', 'card')
        formData.append('refId', cardID)
        formData.append('field', 'media') // media field in card model
        // appending to this card id's media []
        await axios.post(`${SERVER_BASE_URL}/upload/`, formData)

        // clear
        // setSelectedFiles([])
        window.location.reload(false)
    }

    const deleteMedia = async (e, id) => {
        e.preventDefault()
        // delete db's records & existing files
        await axios.delete(`${SERVER_BASE_URL}/upload/files/${id}`)
        window.location.reload(false)
    }

    // ********* upload files end***********

    return <>
        <CustomBreadcrumbs dataProps={dataProps} />
        <h1> Card </h1>
        <>
            <h2>View item</h2>
            {
                !editing &&
                <>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            setLoading(true)
                            new Promise(resolve => {
                                setTimeout(() => resolve([]), 0)
                            }).then(list => {
                                setEditing(true)
                                setLoading(false)
                            })
                        }}
                        disabled={loading}
                    > EDIT
                    </button>
                    {loading && "loading.."}
                </>
            }
            <button onClick={handleDelete}>DELETE</button>

            <br/>
            <Editor front={front_card} back={back_card} description={description} editing={editing}/>
        </>
        {
            editing &&
            <>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        updateItem()
                    }}
                    disabled={loading}
                >SAVE
                </button>
                {loading && "loading.."}
                <button onClick={(e) => {
                    e.preventDefault()
                    window.location.reload(false)
                }}
                        disabled={loading}
                >CANCAL
                </button>
                {loading && "loading.."}
            </>
        }
        <section>
            <hr/>
            <h1>View Media</h1>
            {media.map((file, index) => {
                const fileType = file.mime?.split("/")[0] || "others"
                const src = `${SERVER_BASE_URL}${file.url}`
                if (fileType === 'image') {
                    return <div key={index}>
                        <div> image {file.name} </div>
                        <button onClick={e=> deleteMedia(e, file.id)}>delete</button>
                        <img style={{maxWidth: 800}} src={src} />
                    </div>
                } else if (fileType === 'audio') {
                    return <div key={index}>
                        <div>audio {file.name} </div>
                        <button onClick={e=> deleteMedia(e, file.id)}>delete</button>
                        <audio controls>
                            <source src={src}/>
                        </audio>
                    </div>
                } else if (fileType === 'video') {
                    return <div key={index}>
                        <div>video {file.name} </div>
                        <button onClick={e=> deleteMedia(e, file.id)}>delete</button>
                        <video width="320" height="240" controls>
                            <source src={src}/>
                        </video>
                    </div>
                } else {
                    return <div key={index}>
                        <div>other {file.name} </div>
                        <button onClick={e=> deleteMedia(e, file.id)}>delete</button>
                    </div>
                }
            })}


            <h1>Upload Resources</h1>
            <input type="file" onChange={onFileChange} multiple />
            <button onClick={onFileUpload}>Upload!</button>
            {selectedFiles && <>
                <h3>total size: {formatBytes(selectedFiles.reduce((accumulator, currentValue) => {
                    return accumulator + currentValue.size
                }, 0))}</h3>
            </>}
        </section>


    </>
}


export default Page
