import React, {useEffect, useState} from "react";
import styled from '@emotion/styled'
import Link from "next/link";


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
                        <a href={x.href}>{x.text}</a> {' / '}
                    </div>
            )
            }
        </>
    )
}

export default SimpleBreadcrumbs