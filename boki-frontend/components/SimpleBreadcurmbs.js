import React, {useEffect, useState} from "react";
import styled from 'styled-components'
import Link from "next/link";

const ExpandableStyles = styled.span`
    .expandable:hover {
        background-color: #e6e6ff;
        cursor: pointer;
    }
`


function SimpleBreadcrumbs({crumbs = [{"href": "", "text": ""}]}) {

    return (
        <>
            {crumbs.map((x, index) =>
                    <div key={index}
                        // this style is used for ellipsis if text too long
                         style={{
                             display: "inline-block",
                             overflow: "hidden",
                             textOverflow: "ellipsis",
                             whiteSpace: "nowrap",
                             verticalAlign: "top",
                             maxWidth: 300,
                         }}
                    >
                        <Link
                            key={index}
                            href={x.href}
                        >
                            <a>{x.text}</a>
                        </Link>
                        {` / `}
                    </div>
            )
            }
        </>
    )
}

export default SimpleBreadcrumbs