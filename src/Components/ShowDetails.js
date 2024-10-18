import React, { useState } from 'react'
import Details from './Details';
import './ShowDetails.css';
export default function ShowDetails({ visibility, start, end, parseISO8601Duration, formatDuration, data, updatetime }) {
    const [isvisible, setisvisible] = useState(false);
    const [text, settext] = useState("show details");
    if (visibility === false) return (<></>);
    const handleDetails = (e) => {
        setisvisible(prev => !prev)
        settext(prev => {
            if (prev === "show details") return "hide details";
            else return "show details";
        })
        e.preventDefault()
    }
    return (
        <>
            <div className="Link-header">
                <a href="/" className="App-link" onClick={handleDetails}>{text}</a>
            </div>
            <div className="Details" >
                <Details items={data.slice((start > 0) ? (start - 1) : 0, ((end === Infinity) ? (end) : (end - 1)) + 1)} isvisible={isvisible} parseISO8601Duration={parseISO8601Duration} formatDuration={formatDuration} start={start === -1 ? 1 : start} updatetime={updatetime}></Details>
            </div>
        </>
    )
}
