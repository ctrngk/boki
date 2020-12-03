import React, {useState, useEffect, useRef, useMemo} from 'react'
import SimpleBreadcrumbs from '../../../components/SimpleBreadcurmbs'
import axios from "axios";
import Editor from '../../../components/Editor'
import stripHTML from "../../../utils/stripHTML";
import ComplexTable from '../../../components/ComplexTable'
import {swapB64Upload, dummyCardCreated} from "../../../utils/swapB64Upload";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function getServerSideProps(context) {
    const id = Number(context.query.id)

    const res = await fetch(`${SERVER_BASE_URL}/decks/${id}`)
    const response = await res.json()
    const topicTitle = response.topic.title
    const topicID = response.topic.id
    const deckTitle = response.title
    const data = response.cards
    return {
        props: {
            data,
            deckTitle: deckTitle,
            topicTitle: topicTitle,
            deckID: id,
            topicID: topicID,
        },
    }
}

function CustomBreadcrumbs({dataProps}) {
    const {topicID, deckID, topicTitle, deckTitle} = dataProps

    return <>
        <SimpleBreadcrumbs crumbs={[
            {"href": "/", "text": "home"},
            {"href": `/topic/${topicID}`, "text": `topic (${topicTitle})`},
            {"href": `/topic/deck/${deckID}`, "text": `deck (${deckTitle})`}
        ]}/>
    </>
}


function Page(dataProps) {
    const {deckID, data} = dataProps // current [id].js

    const [editing, setEditing] = useState(false)
    const [currentItem, setCurrentItem] = useState({
        id: null,
        front: {"html": ""},
        back: {"html": ""},
        description: {"html": ""}
    }) // editor value


    // CRUD operations
    const addItem = async () => {

        let data1 = window.editor1.getData()
        let data2 = window.editor2.getData()
        let data3 = window.editor3.getData() // optional description
        if (!data1 || !data2)
            return
        const cardID = await dummyCardCreated(deckID)
        data1 = await swapB64Upload(data1, cardID)
        data2 = await swapB64Upload(data2, cardID)
        data3 = await swapB64Upload(data3, cardID)


        const newData = {
            "front": {"html": data1},
            "back": {"html": data2},
            "deck": {"id": deckID},
            "description": {"html": data3}
        }
        // use PUT instead of POST cos we have created dummy cardID
        const res = await axios.put(
            `${SERVER_BASE_URL}/cards/${cardID}`,
            newData
        )
        window.location.reload(false)
    }

    const deleteItem = async id => {
        const res = await axios.delete(
            `${SERVER_BASE_URL}/cards/${id}`
        )
        window.location.reload(false)
    }

    const updateItem = async (id) => {
        const cardID = id
        let data1 = window.editor1.getData()
        let data2 = window.editor2.getData()
        let data3 = window.editor3.getData()
        if (!data1 || !data2) return
        data1 = await swapB64Upload(data1, cardID)
        data2 = await swapB64Upload(data2, cardID)
        data3 = await swapB64Upload(data3, cardID)

        const newData = {
            "front": {"html": data1},
            "back": {"html": data2},
            "deck": {"id": deckID},
            "description": {"html": data3},
        }
        const res = await axios.put(
            `${SERVER_BASE_URL}/cards/${id}`,
            newData
        )
        window.location.reload(false)
    }


    // ***********table *********
    const handleClickEdit = async (cell, e) => {
        e.preventDefault()
        const id = cell.row.original.id
        const row = data.find(x => x.id === id)
        // editRow
        setEditing(true)
        setCurrentItem({
                id,
                description: {"html": row.description.html},
                front: {"html": row.front.html},
                back: {"html": row.back.html},
            }
        )
    }
    const handleClickDelete = async (cell, e) => {
        e.preventDefault()
        const {id} = cell.row.original
        await deleteItem(id)
    }

    const columns = useMemo(
        () => [
            {
                Header: 'id',
                accessor: 'id'
            },
            {
                Header: 'front',
                accessor: 'front'
            },
            {
                Header: 'back',
                accessor: 'back'
            },
            {
                Header: 'description',
                accessor: 'description'
            },
            {
                Header: 'created_at',
                accessor: 'created_at'
            },
            {
                Header: 'updated_at',
                accessor: 'updated_at'
            },
            {
                Header: "Actions",
                accessor: "Actions",
                Cell: ({cell}) => (
                    <>
                        <button onClick={(e) => handleClickEdit(cell, e)}>
                            EDIT
                        </button>
                        <button onClick={(e) => handleClickDelete(cell, e)}>
                            DELETE
                        </button>
                    </>
                )
            }
        ]
    )
    const tableData = React.useMemo(
        () => data.map(x => {
            return {
                id: x.id,
                front: stripHTML(x.front.html),
                back: stripHTML(x.back.html),
                description: stripHTML(x.description.html),
                created_at: x.created_at,
                updated_at: x.updated_at
            }
        }), []
    )
    // ***********table end*********

    return <>
        <CustomBreadcrumbs dataProps={dataProps}/>


        <h1> Cards</h1>
        <section>
            <ComplexTable columns={columns} data={tableData}/>
        </section>

        <>
            {editing &&
            <>
                <h2>Edit item</h2>
                <Editor
                    front={currentItem.front.html}
                    back={currentItem.back.html}
                    description={currentItem.description.html}
                    editing={editing}
                />
                <form onSubmit={e => {
                    e.preventDefault()
                    updateItem(currentItem.id)
                }}>
                    <button>Update item</button>
                    <button onClick={() => setEditing(false)}>
                        Cancel
                    </button>
                </form>

            </>
            }
            {!editing &&
            <>
                <h2>Add Item</h2>
                <form onSubmit={event => {
                    event.preventDefault()
                    addItem()
                }}>
                    <Editor front="" back="" description="" editing={!editing}/>
                    <br/>
                    <button>Add new item</button>
                </form>
            </>
            }
        </>


    </>
}


export default Page
