import React, {useContext, useEffect, useState} from "react";
import SimpleBreadcrumbs from '../../components/SimpleBreadcurmbs'
import axios from 'axios'
import Link from "next/link"

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function getServerSideProps(context) {
    const id = Number(context.query.id)

    const res = await fetch(`${SERVER_BASE_URL}/topics/${id}`)
    const response = await res.json()
    const topicTitle = response.title
    const data = response.decks
    const topicID = id
    return {
        props: {
            data,
            topicTitle,
            topicID,
        },
    }
}

function CustomBreadcrumbs({dataProps}) {
    const {topicTitle, topicID} = dataProps
    return <>
        <SimpleBreadcrumbs crumbs={[
            {"href": "/", "text": "home"},
            {"href": `/topic/${topicID}`, "text": `topic (${topicTitle})`}
        ]}/>
    </>
}

function str2array(str) {
    if (typeof (str) === 'object')
        return str
    else
        return str.split(",").map(x => Number(x))

}


function Page(dataProps) {

    const {data, topicID} = dataProps

    const [items, setItems] = useState(data)
    const [editing, setEditing] = useState(false)

    const initialFormState = {
        id: null,
        title: "",
        description: "",
        EASY_BONUS: 1.3,
        INTERVAL_MODIFIER: 1,
        MAXIMUM_INTERVAL: 36500,
        MINIMUM_INTERVALL: 2,
        NEW_INTERVAL: 0.7,
        GRADUATING_INTERVAL: 15,
        EASY_INTERVAL: 60,
        STARTING_EASE: 2.5,
        NEW_STEPS: [15, 1440, 8640],
        LAPSES_STEPS: [20],
    }
    const [item, setItem] = useState(initialFormState)
    const [currentItem, setCurrentItem] = useState(initialFormState)

    // CRUD operations
    const addItem = async item => {
        let newData = item
        delete newData.id
        newData.topic = {id: topicID}
        newData.NEW_STEPS = str2array(newData.NEW_STEPS)
        newData.LAPSES_STEPS = str2array(newData.LAPSES_STEPS)
        const res = await axios.post(
            `${SERVER_BASE_URL}/decks`,
            newData
        )
        window.location.reload(false)
    }

    const deleteItem = async id => {
        setEditing(false)
        const res = await axios.delete(
            `${SERVER_BASE_URL}/decks/${id}`
        )
        window.location.reload(false)
    }

    const updateItem = async (id, updatedItem) => {
        setEditing(false)
        let newData = updatedItem
        delete newData.id
        newData.topic = {id: topicID}
        newData.NEW_STEPS = str2array(newData.NEW_STEPS)
        newData.LAPSES_STEPS = str2array(newData.LAPSES_STEPS)
        const res = await axios.put(
            `${SERVER_BASE_URL}/decks/${id}`,
            newData
        )
        window.location.reload(false)
    }

    const editRow = item => {
        setEditing(true)
        setCurrentItem(
            {
                id: item.id,
                title: item.title,
                description: item.description,
                EASY_BONUS: item.EASY_BONUS,
                INTERVAL_MODIFIER: item.INTERVAL_MODIFIER,
                MAXIMUM_INTERVAL: item.MAXIMUM_INTERVAL,
                MINIMUM_INTERVALL: item.MINIMUM_INTERVALL,
                NEW_INTERVAL: item.NEW_INTERVAL,
                GRADUATING_INTERVAL: item.GRADUATING_INTERVAL,
                EASY_INTERVAL: item.EASY_INTERVAL,
                STARTING_EASE: item.STARTING_EASE,
                NEW_STEPS: item.NEW_STEPS,
                LAPSES_STEPS: item.LAPSES_STEPS
            }
        )
    }

    function onEdit(e) {
        setCurrentItem({...currentItem, [e.target.title]: e.target.value})
    }

    function onAdding(e) {
        setItem({...item, [e.target.title]: e.target.value})
    }

    return <>
        <CustomBreadcrumbs dataProps={dataProps}/>
        <main>
            <h2>
                View Decks
            </h2>
            {/*<pre><code>*/}
            {/*    {JSON.stringify(items, null, 8)}*/}
            {/*</code></pre>*/}
            <table>
                <tbody>
                <th>
                    <tr>Deck</tr>
                    <tr>description</tr>
                    <tr>EASY_BONUS</tr>
                    <tr>INTERVAL_MODIFIER</tr>
                    <tr>MAXIMUM_INTERVAL</tr>
                    <tr>MINIMUM_INTERVALL</tr>
                    <tr>NEW_INTERVAL</tr>
                    <tr>GRADUATING_INTERVAL</tr>
                    <tr>EASY_INTERVAL</tr>
                    <tr>STARTING_EASE</tr>
                    <tr>NEW_STEPS</tr>
                    <tr>LAPSES_STEPS</tr>
                    <tr>Actions</tr>
                </th>
                {items.length > 0
                    ? items.map(item => (
                        <td key={item.id}>
                            <tr><Link href={`/topic/deck/${item.id}`}><a>{item.title}</a></Link></tr>
                            <tr>{item.description || "null"}</tr>
                            <tr>{item.EASY_BONUS}</tr>
                            <tr>{item.INTERVAL_MODIFIER}</tr>
                            <tr>{item.MAXIMUM_INTERVAL}</tr>
                            <tr>{item.MINIMUM_INTERVAL}</tr>
                            <tr>{item.NEW_INTERVAL}</tr>
                            <tr>{item.GRADUATING_INTERVAL}</tr>
                            <tr>{item.EASY_INTERVAL}</tr>
                            <tr>{item.STARTING_EASE}</tr>
                            <tr>{JSON.stringify(item.NEW_STEPS)}</tr>
                            <tr>{JSON.stringify(item.LAPSES_STEPS)}</tr>
                            <tr>
                                <button onClick={() => editRow(item)}>
                                    Edit
                                </button>
                                <button onClick={() => deleteItem(item.id)}>
                                    Delete
                                </button>
                            </tr>
                        </td>
                    ))
                    : <td>
                        <tr><h1>No items</h1></tr>
                    </td>
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
                               onChange={onEdit}/>
                        <br/>
                        <label>description</label>
                        <input type="text" title="description" value={currentItem.description}
                               onChange={onEdit}/>
                        <br/>
                        <label>EASY_BONUS</label>
                        <input type="text" title="EASY_BONUS" value={currentItem.EASY_BONUS}
                               onChange={onEdit}/>
                        <br/>
                        <label>INTERVAL_MODIFILER</label>
                        <input type="text" title="INTERVAL_MODIFILER" value={currentItem.INTERVAL_MODIFIER}
                               onChange={onEdit}/>
                        <br/>
                        <label>MAXIMUM_INTERVAL</label>
                        <input type="text" title="MAXIMUM_INTERVAL" value={currentItem.MAXIMUM_INTERVAL}
                               onChange={onEdit}/>
                        <br/>
                        <label>MINIMUM_INTERVALL</label>
                        <input type="text" title="MINIMUM_INTERVALL" value={currentItem.MINIMUM_INTERVALL}
                               onChange={onEdit}/>
                        <br/>
                        <label>NEW_INTERVAL</label>
                        <input type="text" title="NEW_INTERVAL" value={currentItem.NEW_INTERVAL}
                               onChange={onEdit}/>
                        <br/>
                        <label>GRADUATING_INTERVAL</label>
                        <input type="text" title="GRADUATING_INTERVAL" value={currentItem.GRADUATING_INTERVAL}
                               onChange={onEdit}/>
                        <br/>
                        <label>EASY_INTERVAL</label>
                        <input type="text" title="EASY_INTERVAL" value={currentItem.EASY_INTERVAL}
                               onChange={onEdit}/>
                        <br/>
                        <label>STARTING_EASE</label>
                        <input type="text" title="STARTING_EASE" value={currentItem.STARTING_EASE}
                               onChange={onEdit}/>
                        <br/>
                        <label>NEW_STEPS</label>
                        <input type="text" title="NEW_STEPS" value={currentItem.NEW_STEPS}
                               onChange={onEdit}/>
                        <br/>
                        <label>LAPSES_STEPS</label>
                        <input type="text" title="LAPSES_STEPS" value={currentItem.LAPSES_STEPS}
                               onChange={onEdit}/>
                        <br/>

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
                        <input type="text" title="title" value={item.title} onChange={onAdding}/>
                        <br/>
                        <label>description</label>
                        <input type="text" title="description" value={item.description} onChange={onAdding}/>
                        <br/>
                        <label>EASY_BONUS</label>
                        <input type="text" title="EASY_BONUS" value={item.EASY_BONUS} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>INTERVAL_MODIFIER</label>
                        <input type="text" title="INTERVAL_MODIFIER" value={item.INTERVAL_MODIFIER} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>MAXIMUM_INTERVAL</label>
                        <input type="text" title="MAXIMUM_INTERVAL" value={item.MAXIMUM_INTERVAL} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>MINIMUM_INTERVALL</label>
                        <input type="text" title="MINIMUM_INTERVALL" value={item.MINIMUM_INTERVALL} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>NEW_INTERVAL</label>
                        <input type="text" title="NEW_INTERVAL" value={item.NEW_INTERVAL} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>GRADUATING_INTERVAL</label>
                        <input type="text" title="GRADUATING_INTERVAL" value={item.GRADUATING_INTERVAL} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>EASY_INTERVAL</label>
                        <input type="text" title="EASY_INTERVAL" value={item.EASY_INTERVAL} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>STARTING_EASE</label>
                        <input type="text" title="STARTING_EASE" value={item.STARTING_EASE} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>NEW_STEPS</label>
                        <input type="text" title="NEW_STEPS" value={item.NEW_STEPS} onChange={
                            onAdding
                        }/>
                        <br/>
                        <label>LAPSES_STEPS</label>
                        <input type="text" title="LAPSES_STEPS" value={item.LAPSES_STEPS} onChange={
                            onAdding
                        }/>
                        <button>Add new item</button>
                    </form>
                </>
            }
        </>


    </>
}


export default Page
