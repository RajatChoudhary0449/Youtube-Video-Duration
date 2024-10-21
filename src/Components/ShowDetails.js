import React, { useState } from 'react'
import Details from './Details';
import './ShowDetails.css';
export default function ShowDetails({ data }) {
    const [isvisible, setisvisible] = useState(false);
    const [text, settext] = useState("show details");
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
                <Details items={data} isvisible={isvisible}></Details>
            </div>
        </>
    )
}
