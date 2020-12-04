import React, {createContext, useEffect, useState} from "react";
import SimpleBreadcrumbs from '../components/SimpleBreadcurmbs'
import axios from 'axios'
import Link from "next/link";
import Error from "next/error";

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function getServerSideProps(context) {

    console.log("topics", `${SERVER_BASE_URL}/topics`)
    const res = await fetch(`${SERVER_BASE_URL}/topics`)
    const response = await res.json()
    if (!response) {
        const e = new Error("no permission?")
        e.code = 'ENOENT'
        throw e
    }
    const data = response.map(
        function (r) {
            return {
                "title": r.title,
                "id": r.id,
            }
        }
    )

    return {
        props: {data},
    }
}

function Page({data}) {
    const [items, setItems] = useState(data)
    const [editing, setEditing] = useState(false)

    const initialFormState = {id: null, title: ''}
    const [item, setItem] = useState(initialFormState)
    const [currentItem, setCurrentItem] = useState(initialFormState)

    // CRUD operations
    const addItem = async item => {
        const newData = {
            "title": item.title
        }
        const res = await axios.post(
            `${SERVER_BASE_URL}/topics`,
            newData
        )
        window.location.reload(false)
    }

    const deleteItem = async (id, e) => {
        e.preventDefault()
        e.target.disabled = true
        e.target.innerText = "DELETING"
        setEditing(false)
        const res = await axios.delete(
            `${SERVER_BASE_URL}/topics/${id}`
        )
        window.location.reload(false)
    }

    const updateItem = async (id, updatedItem) => {
        setEditing(false)
        const newData = {
            "title": updatedItem.title
        }
        const res = await axios.put(
            `${SERVER_BASE_URL}/topics/${id}`,
            newData
        )
        window.location.reload(false)
    }

    const editRow = item => {
        setEditing(true)
        setCurrentItem({id: item.id, title: item.title})
    }

    return <>
        <SimpleBreadcrumbs crumbs={[
            {"href": "/", "text": "home"}
        ]}/>
        <main>
            <h2> View Topics </h2>
            <table>
                <thead>
                <tr>
                    <th>Topic</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {items.length > 0
                    ? items.map((item, index) => (
                        <tr key={index}>
                            <td><Link href={`/topic/${item.id}`}><a>{item.title}</a></Link></td>
                            <td>
                                <button onClick={() => editRow(item)}> Edit </button>
                            </td>
                            <td>
                                <button onClick={(e) => deleteItem(item.id, e)}> Delete </button>
                            </td>
                        </tr>
                    ))
                    : <tr>
                        <td>No items</td>
                    </tr>
                }
                </tbody>
            </table>
        </main>

        <>
            {editing
                ? <>
                    <h2>Edit item</h2>
                    <form onSubmit={e => {
                        e.preventDefault()
                        updateItem(currentItem.id, currentItem)
                    }}>
                        <label>Name</label>
                        <input type="text" title="title" value={currentItem.title}
                               onChange={e =>
                                   setCurrentItem({...currentItem, [e.target.title]: e.target.value})
                               }/>
                        <button>Update item</button>
                        <button onClick={() => setEditing(false)}>
                            Cancel
                        </button>
                    </form>

                </>
                : <>
                    <h2>Add Item</h2>
                    <form onSubmit={event => {
                        event.preventDefault()
                        if (!item.title) return
                        addItem(item)
                        setItem(initialFormState)
                    }}>
                        <label>Name</label>
                        <input type="text" title="title" value={item.title} onChange={
                            e => setItem({...item, [e.target.title]: e.target.value})
                        }/>
                        <button>Add new item</button>
                    </form>
                </>
            }
        </>

        <hr/>
        <h1><Link href="/settings/1"><a>Global Settings</a></Link></h1>
        <h1><Link href="/learning"><a>Learning</a></Link></h1>
        <h1><Link href="/statistics"><a>Statistics</a></Link></h1>
        <h1><Link href="/getShared"><a>Get shared</a></Link></h1>


    </>
}


export default Page