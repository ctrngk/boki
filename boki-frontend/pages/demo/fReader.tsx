import Link from "next/link";
import React, {useState} from "react";

const App = () => {
    const [content, setContent] = useState("")

    const handleFile = (e) => {
        setContent(e.target.result)
    }

    const handleChangeFile = (file) => {
        let fileData = new FileReader()
        fileData.onloadend = handleFile
        fileData.readAsDataURL(file)
    }

        return(
            <>
                <Link href="/"><a>HOME</a></Link>
                <h1>File Reader</h1>
            <div>
                <input type="file" onChange={e =>
                    handleChangeFile(e.target.files[0])} />
            </div>
                <img src={content}/>
            </>
        )

}

export default App