import React, {useEffect, useLayoutEffect, useState} from 'react'
import useScript from "../utils/useScript"

const Editor = ({front, back, description, editing = false}) => {
    const status = useScript("/ckeditor5/build/ckeditor.js")
    useScript("/loadCK5.js")
    return (<>
        {/*cannot undo*/}
        {status === "ready" && editing && window.loadCK5 && window.loadCK5()}
        <div className="App">
            <div>
                <h3 style={{textAlign: "center"}}>Front Card</h3>
                <div>
                    <div className="document-editor1__toolbar"/>
                </div>
                <div>
                    <div className="editor1">
                        <div style={{overflowWrap: 'break-word'}} className="content" dangerouslySetInnerHTML={{__html: front}}/>
                    </div>
                </div>
            </div>
            <br/>
            <div>
                <h3 style={{textAlign: "center"}}>Back Card</h3>
                <div>
                    <div className="document-editor2__toolbar"/>
                </div>
                <div>
                    <div className="editor2">
                        <div style={{overflowWrap: 'break-word'}} className="content" dangerouslySetInnerHTML={{__html: back}}/>
                    </div>
                </div>
            </div>
            <br/>
            <div>
                <h3 style={{textAlign: "center"}}>Description Card</h3>
                <div>
                    <div className="document-editor3__toolbar"/>
                </div>
                <div>
                    <div className="editor3">
                        <div style={{overflowWrap: 'break-word'}} className="content" dangerouslySetInnerHTML={{__html: description}}/>
                    </div>
                </div>
            </div>
        </div>
    </>)
}


export default Editor