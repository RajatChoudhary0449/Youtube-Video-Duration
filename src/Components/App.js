import './styles.css';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ShowDetails from './ShowDetails';

function App() {
  const [link, changelink] = useState("")
  const [start, setstart] = useState(-1)
  const [end, setend] = useState(Infinity)
  const [data, setdata] = useState([]);//Playlist list.
  const [time, settime] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [resultmessage, setresultmessage] = useState("");
  const inputref = useRef();
  const handlestart = (e) => {
    setstart(prev => {
      if (e.target.value === '') return -1;
      if (e.target.value[e.target.value - 1] === '.' || e.target.value[e.target.value - 1] === '-') return prev;
      const cur = Number(e.target.value);
      if (cur > end) return end;
      if (data.length === 0) return cur;
      if (cur < 1) return 1;
      if (cur <= data.length) return cur;
      else return prev;
    });
  }
  const handleend = (e) => {
    setend(prev => {
      if (e.target.value === '') return Infinity;
      if (e.target.value[e.target.value - 1] === '.' || e.target.value[e.target.value - 1] === '-') return prev;
      let cur = Number(e.target.value);
      if (!data.length) return cur;
      if (cur < 1) return 1;
      while (cur > data.length) {
        cur = String(cur).substring(1);
        cur = Number(cur);
      }
      return cur;
    });
  }
  const fetchData = useCallback(async (link) => {
    const apiKey = process.env.REACT_APP_API_KEY;
    const playlistId = extractPlaylistId(link);
    if (!playlistId) {
      setdata([]);
      return -1;
    }
    const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    const videoIds = [];
    let nextPageToken = '';
    if (link === "") {
      setdata([]);
      return -1;
    }
    do {
      let response;
      try {
        response = await fetch(playlistItemsUrl + (nextPageToken ? `&pageToken=${nextPageToken}` : ''));
        if (!response.ok) {
          if (response.status === 404) {
            setresultmessage("");
            inputref.current.focus();
            setdata([]);
            console.error("Playlist not found.");
          }
          return;
        }
      }
      catch (error) {
        console.log(error);
        setdata([]);
        alert("Network Error");
        inputref.current.focus();
        return;
      }
      const curdata = await response.json();
      if (!curdata || !curdata.items) return;
      curdata.items.forEach(item => {
        videoIds.push(item.contentDetails.videoId);
      });
      nextPageToken = curdata.nextPageToken;
    }
    while (nextPageToken);
    const videoDetails = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50).join(',');
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batchIds}&key=${apiKey}`;
      const videoResponse = await fetch(videoDetailsUrl);
      const videoData = await videoResponse.json();
      videoDetails.push(...videoData.items);
    }
    setdata(videoDetails);
  }, []);

  function extractPlaylistId(url) {
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
  function updatetime(time) {
    if (time[3] >= 60) {
      time[2] += Math.floor(time[3] / 60);
      time[3] %= 60;
    }
    if (time[2] >= 60) {
      time[1] += Math.floor(time[2] / 60);
      time[2] %= 60;
    }
    if (time[1] >= 24) {
      time[0] += Math.floor(time[1] / 24);
      time[1] %= 24;
    }
  }

  function parseISO8601Duration(duration) {
    const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    const days = parseInt(matches[1] || 0);
    const hours = parseInt(matches[2] || 0);
    const minutes = parseInt(matches[3] || 0);
    const seconds = parseInt(matches[4] || 0);
    return [days, hours, minutes, seconds];
  }
  function formatDuration(time) {
    const [days, hours, minutes, remainingSeconds] = time;
    if (time[0]) return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    else return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  const getrawtimes = () => {
    let arr = [];
    let startidx = ((start === -1) ? (1) : start) - 1;
    let endidx = ((end === Infinity) ? (data.length) : end) - 1;
    let curtime = [0, 0, 0, 0], totaltime = [0, 0, 0, 0]
    for (let i = startidx; i <= endidx; i++) {
      let idx = i + 1;
      curtime = parseISO8601Duration(data[idx - 1].contentDetails.duration);
      for (let j = 0; j < 4; j++) {
        totaltime[j] += curtime[j];
      }
      updatetime(totaltime);
      arr.push({ idx: idx, curtime: curtime, totaltime: [...totaltime] });
    }
    settime(arr);
    return arr;
  }
  useEffect(() => {
    getrawtimes();
  }, [data]);
  const handleformrequest = async (e) => {
    e.preventDefault();
    const rawtimes = getrawtimes();
    checkfocus();
    if (data.length === 0) return;
    setresultmessage(`Total Duration: ${formatDuration(rawtimes[rawtimes.length - 1]['totaltime'])}`);
  }
  const handlechangelink = (e) => {
    const cur = e.target.value;
    changelink(cur);
    setresultmessage("");
  }
  const checkfocus = async (e) => {
    if (fetching) return;
    setFetching(true);
    await fetchData(link);
    setFetching(false);
  }
  return (
    <div className="container">
      <h1>YouTube Playlist Duration Calculator</h1>
      <form method='post' onSubmit={handleformrequest}>

        <label htmlFor="link">Enter the link of the YouTube playlist:</label>
        <input type="text" id="link" ref={inputref} placeholder="Playlist URL" autoComplete="off" autoFocus value={link} onChange={(e) => { handlechangelink(e); }} onFocus={(e) => { setstart(-1); setend(Infinity); }} onBlur={checkfocus}></input>

        <label htmlFor="start">Starting Video Index (1-based):</label>
        <input type="number" id="start" placeholder="Start Index(Optional)" value={(start === -1) ? '' : start} onChange={(e) => handlestart(e)} />

        <label htmlFor="end">Ending Video Index (1-based):</label>
        <input type="number" id="end" placeholder="End Index(Optional)" value={end === Infinity ? '' : end} onBlur={() => { if (end < start) setend(start); }} onChange={(e) => handleend(e)} />

        <button id="calculate" type='submit' onClick={handleformrequest}>Get Total Duration</button>
        <p id="result">{resultmessage}</p>
        <ShowDetails data={time} formatDuration={formatDuration}></ShowDetails>
      </form >
    </div >
  );
}

export default App;