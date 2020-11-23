import React, {useReducer, useState, useRef} from 'react'
import styled from "styled-components";
import Link from "next/link";
import axios from "axios";

const TableStyles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }

`

const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL

export async function getServerSideProps(context) {
    const id = Number(context.query.id)

    const res = await fetch(`${SERVER_BASE_URL}/settings/${id}`)
    const response = await res.json()
    const {audio_auto_play, audio_auto_loop, theme} = response
    const data = {id, audio_auto_play, audio_auto_loop, theme}
    return {
        props: {
            data
        },
    }
}

const App = ({data}) => {
    // Data
    const itemsData = [
        {id: data.id, content: {...data}}
    ]
    const [items, setItems] = useState(itemsData)
    const [editing, setEditing] = useState(false)
    const [itemEdited, setItemEdited] = useState(null)

    // CRUD operations
    const updateItem = async (id, updatedItem) => {
        setEditing(false)
        setItems(items.map(item => (item.id === id ? updatedItem : item)))
        let newData = updatedItem.content
        delete newData.id
        await axios.put(`${SERVER_BASE_URL}/settings/${data.id}`, newData)
        window.location.reload(false)
    }

    const editRow = row => {
        setEditing(true)
        setItemEdited(row)
    }

    function onEdit(e) {
        setItemEdited({
            ...itemEdited,
            content: {...itemEdited.content, [e.target.name]: e.target.value}
        })
    }

    return (
        <div className="container">
            <Link href="/"><a>HOME</a></Link>
            <h1>Settings (Not implemented yet)</h1>
            <div>
                <main>
                    <h2>View items</h2>
                    <table>
                        <thead>
                        <tr>
                            <th>audio_auto_play</th>
                            <th>audio_auto_loop</th>
                            <th>theme</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length > 0
                            ? items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.content.audio_auto_play.toString()}</td>
                                    <td>{item.content.audio_auto_loop.toString()}</td>
                                    <td>{item.content.theme}</td>
                                    <td>
                                        <button onClick={() => editRow(item)}>
                                            Edit
                                        </button>
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
                <section>
                    {editing && <>
                        <h2>Edit item</h2>
                        <form onSubmit={e => {
                            e.preventDefault()
                            updateItem(itemEdited.id, itemEdited)
                        }}>
                            <div>
                                <label>audio_auto_play</label>
                                <select name="audio_auto_play" value={itemEdited.content.audio_auto_play}
                                        onChange={onEdit}>
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            </div>
                            <div>
                                <label>audio_auto_loop</label>
                                <select name="audio_auto_loop" value={itemEdited.content.audio_auto_loop}
                                        onChange={onEdit}>
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            </div>
                            <div>
                                <label>theme</label>
                                <select name="theme" value={itemEdited.content.theme} onChange={onEdit}>
                                    <option value="white">white</option>
                                    <option value="black">black</option>
                                </select>
                            </div>
                            <button>Update item</button>
                            <button onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </form>
                    </>
                    }
                </section>
            </div>
        </div>
    )
}

const Page = ({data}) => {
    return <>
        <TableStyles>
            <App data={data}/>
        </TableStyles>
    </>
}

export default Page