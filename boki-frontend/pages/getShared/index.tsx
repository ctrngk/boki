import React, {useRef, useState} from 'react'
import axios from 'axios'
import Link from "next/link";
import displaySize from '../../utils/displaySize'


const FileUploader = ({customID}) => {
    // Initially, no file is selected
    const [selectedFiles, setSelectedFiles] = useState([])
    const inputRef = useRef()

    // On file select (from the pop up)
    // Update the state
    const onFileChange = e => {
        setSelectedFiles(Array.from(e.target.files))
        // https://dev.to/muhammadawaisshaikh/how-to-get-an-updated-state-of-child-component-in-the-parent-component-using-the-callback-method-1i5
        // child2parentFunc(Array.from(e.target.files))
    }

    // On file upload (click the upload button)
    const onFileUpload = (e) => {
        // Create an object of formData
        const formData = new FormData()
        // Update the formData object
        selectedFiles.forEach(selectedFile => {
                formData.append(customID, selectedFile, selectedFile.name)
            }
        )
        // Request made to the backend api
        // Send formData object
        axios.post("/api/upload", formData)
        // save to database

        // clear
        setSelectedFiles([])
        // @ts-ignore
        inputRef.current.value = ""
    }

    // File content to be displayed after
    // file upload is complete
    const fileData = () => {
        if (selectedFiles) {
            return <div>
                <h3>total size: {displaySize(selectedFiles.reduce((accumulator, currentValue) => {
                    return accumulator + currentValue.size
                }, 0))}</h3>
            </div>
        } else {
            return <div>
                <br/>
                <h4>Choose before Pressing the Upload button</h4>
            </div>
        }
    }

    return <div>
        <div>
            <input type="file" onChange={onFileChange} multiple ref={inputRef}/>
            <button onClick={onFileUpload}> Upload!</button>
        </div>
        {fileData()}
    </div>


}


const App = () => {

    return (
        <>
            <Link href="/"><a>HOME</a></Link>
            <h1>Get Shared</h1>
            <h2>Get Shared from anki</h2>
            <FileUploader customID="a"/>
        </>
    )
}

export default App

