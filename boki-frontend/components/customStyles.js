import styled from "@emotion/styled";

export const EllipsisDiv = styled.div`
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: top;
    max-width: 40px;
    &:hover { 
        overflow: visible;
    }
}
`

export const TestDiv = styled.div`
    color: red;
`