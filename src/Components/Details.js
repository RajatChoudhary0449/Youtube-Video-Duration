import React from 'react'
import ListItem from './ListItem';
import './Details.css';
export default function Details(props) {
    const { items, isvisible, parseISO8601Duration, formatDuration, start, updatetime } = props;
    if (!isvisible) return (<></>);
    let curitems = items.map((item) => parseISO8601Duration(item.contentDetails.duration))
    if (items.length === 0) return <p>No Items to show</p>;
    let curidx = start - 1;
    let curtime;
    let time = [0, 0, 0, 0];
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
                {curitems.map(item => {
                    curidx = curidx + 1;
                    curtime = (item);
                    for (let i = 0; i < curtime.length; i++) time[i] += curtime[i];
                    updatetime(time);
                    return (<ListItem key={curidx} idx={curidx} curtime={formatDuration(curtime)}
                        totaltime={formatDuration(time)} ></ListItem>)
                })
                }
            </tbody>
        </table >
    )
}
