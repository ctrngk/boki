import FileUploader from "../components/FileUploader";
import {useState} from "react";

const App = () => {

    const [value, setValue] = useState([])

    if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        // browser
        window.value1 = value
    }
    console.log({value})
    // https://dev.to/muhammadawaisshaikh/how-to-get-an-updated-state-of-child-component-in-the-parent-component-using-the-callback-method-1i5
    const fuParentFunc = (childData) => {
        setValue(childData)
    }

    return <>
        <h1>Test Page</h1>
        <h1>value: {Array.from(value).map(x => <div>{x.name}</div>)} </h1>
        {/*<h1>value: {JSON.stringify(value[0].name)}</h1>*/}
        <FileUploader child2parentFunc={e => fuParentFunc(e)} />
        </>
}

export default App