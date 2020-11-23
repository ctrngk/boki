import axios from 'axios'

import React, {useRef, useState} from 'react'
import formatBytes from '../utils/displaySize'

const FileUploader = ({cardID}) => {
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
    const onFileUpload = () => {
        // Create an object of formData
        const formData = new FormData()
        // Update the formData object
        selectedFiles.forEach(selectedFile => {
                formData.append(cardID, selectedFile, selectedFile.name)
            }
        )
        // Request made to the backend api
        // Send formData object
        axios.post("/api/upload", formData)
        // why not save database here? Because we don't have card ID
        // save to database

        // clear
        setSelectedFiles([])
        inputRef.current.value = ""
    }

    // File content to be displayed after
    // file upload is complete
    const fileData = () => {
        if (selectedFiles) {
            return <div>
                <h3>total size: {formatBytes(selectedFiles.reduce((accumulator, currentValue) => {
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
            <button onClick={onFileUpload}>
                Upload!
            </button>
        </div>
        {fileData()}
    </div>


}

export default FileUploader
