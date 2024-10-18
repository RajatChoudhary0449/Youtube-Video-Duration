import React, { useState } from 'react'
import Details from './Details';
export default function ShowDetails({ visibility, start, end, parseISO8601Duration, formatDuration, data }) {
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
        const curdata = (data.map(curdata => formatDuration(parseISO8601Duration(curdata.contentDetails.duration))));
        console.log(curdata);
    }
    return (
        <>
            <a href="/" onClick={handleDetails}>{text}</a>
            <div class="Details" >
                <Details items={data.slice((start > 0) ? (start - 1) : 0, ((end === Infinity) ? (end) : (end - 1)) + 1)} isvisible={isvisible} parseISO8601Duration={parseISO8601Duration} formatDuration={formatDuration} start={start === -1 ? 1 : start}></Details>
            </div>
        </>
    )
}
