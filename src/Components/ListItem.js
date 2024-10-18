import React from 'react'

export default function ListItem({ idx, curtime, totaltime }) {

    return (
        <tr>
            <td>{idx}</td>
            <td>{curtime}</td>
            <td>{totaltime}</td>
        </tr>
    )
}
