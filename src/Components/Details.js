import React from 'react'
import ListItem from './ListItem';
import './Details.css';
export default function Details(props) {
    const { items, isvisible } = props;
    if (!isvisible) return (<></>);
    function formatDuration(time) {
        const [days, hours, minutes, remainingSeconds] = time;
        if (time[0]) return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
        else return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    if (items.length === 0) return <p>No Items to show</p>;
    return (
        <table>
            <thead>
                <tr>
                    <th className='index-column'>Index</th>
                    <th>Current Time</th>
                    <th>Accumulated Time</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => {
                    return (<ListItem key={item['idx']} idx={item['idx']} curtime={formatDuration(item['curtime'])}
                        totaltime={formatDuration(item['totaltime'])} ></ListItem>)
                })
                }
            </tbody>
        </table >
    )
}
