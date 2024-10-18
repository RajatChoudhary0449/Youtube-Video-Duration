import './styles.css';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ShowDetails from './ShowDetails';

function App() {
  const [link, changelink] = useState("")
  const [start, setstart] = useState(-1)
  const [end, setend] = useState(Infinity)
  const [data, setdata] = useState([]);//Playlist list.
  const [showdetail, setshowdetail] = useState(false);
  const inputref = useRef();
  const fetchData = useCallback(async () => {
    const apiKey = process.env.REACT_APP_API_KEY;
    const playlistId = extractPlaylistId(link);
    if (!playlistId) {
      setdata([]);
      return;
    }
    const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    const videoIds = [];
    let nextPageToken = '';
    if (link === "") return;
    do {
      let response;
      try {
        response = await fetch(playlistItemsUrl + (nextPageToken ? `&pageToken=${nextPageToken}` : ''));
        if (!response.ok) {
          if (response.status === 404) {
            setdata([]);
            setstart(-1);
            setend(Infinity);
          }
          return;
        }
      }
      catch (error) {
        alert("Network Error");
      }
      const curdata = await response.json();
      if (!curdata || !curdata.items) return;
      curdata.items.forEach(item => {
        videoIds.push(item.contentDetails.videoId);
      });
      nextPageToken = curdata.nextPageToken;
    }
    while (nextPageToken);
    // Fetch video details in batches of 50
    const videoDetails = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50).join(',');
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batchIds}&key=${apiKey}`;
      const videoResponse = await fetch(videoDetailsUrl);
      const videoData = await videoResponse.json();
      videoDetails.push(...videoData.items);
    }

    setdata(videoDetails);
  }, [link]);

  useEffect(() => {
    fetchData();
    setshowdetail(false);
  }, [link, fetchData]);
  useEffect(() => {
    setshowdetail(false);
    document.getElementById('result').innerText = '';
  }, [start, end])
  const handlerequest = async () => {
    const startIndex = (start > 0) ? (start - 1) : 0;
    const endIndex = (end === Infinity) ? (end) : (end - 1);
    if (link.length === 0) {
      alert("Link cannot be left empty.");
      setshowdetail(false);
      return;
    }
    if (!data || !data.length) {
      alert(`Please enter a valid YouTube playlist URL. `);
      setshowdetail(false);
      return;
    }
    try {
      const totalDuration = await getPlaylistDuration(startIndex, endIndex);
      document.getElementById('result').innerText = `Total Duration: ${formatDuration(totalDuration)}`;
      setshowdetail(true);
    } catch (error) {
      console.error(error);
      setshowdetail(false)
      document.getElementById('result').innerText = 'Error fetching playlist duration.';
    }
  }
  function extractPlaylistId(url) {
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
  async function getPlaylistDuration(startIndex, endIndex) {
    const selectedVideoIds = data.slice(startIndex, endIndex + 1);
    const videoDurations = await getVideoDurations(selectedVideoIds);
    const curtime = [0, 0, 0, 0];
    for (let i = 0; i < videoDurations.length; i++) {
      for (let j = 0; j < curtime.length; j++) curtime[j] += videoDurations[i][j];
      updatetime(curtime);
    }
    return curtime;
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
  async function getVideoDurations(data) {
    return data.map(item => {
      const duration = item.contentDetails.duration;
      return parseISO8601Duration(duration);
    });
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
  const handleformrequest = (e) => {
    e.preventDefault();
  }

  const checkfocus = (e) => {
    if (!data.length) {
      if (link !== '')
        alert(`Your playlist is not correct so you cannot go to ${e.target.id} input field`);
      else
        alert(`Your playlist field cannot be left empty please fill it.`);
      inputref.current.focus();
      document.getElementById("result").innerText = "";
    }
    else {
      e.target.removeAttribute("readonly")
    }
  }
  return (
    <div className="container">
      <h1>YouTube Playlist Duration Calculator</h1>
      <form method='post' onSubmit={(e) => { handleformrequest(e); }}>

        <label htmlFor="link">Enter the link of the YouTube playlist:</label>
        <input type="text" id="link" placeholder="Playlist URL" autoComplete="off" autoFocus value={link} onChange={(e) => { changelink(e.target.value); }} ref={inputref} onFocus={(e) => { setstart(-1); setend(Infinity); }}></input>

        <label htmlFor="start">Starting Video Index (1-based):</label>
        <input type="number" id="start" placeholder="Start Index(Optional)" value={(start === -1) ? '' : start} onFocus={e => { checkfocus(e); }} readOnly onBlur={(e) => { e.target.setAttribute("Readonly", 'true') }} onChange={(e) => {
          setstart(prev => {
            if (e.target.value === '') return -1;
            const cur = Number(e.target.value);
            if (cur > end) return end;
            if (data.length === 0) return cur;
            if (cur < 1) return 1;
            if (cur <= data.length) return cur;
            else return prev;
          });
        }} />

        <label htmlFor="end">Ending Video Index (1-based):</label>
        <input type="number" id="end" placeholder="End Index(Optional)" value={end === Infinity ? '' : end} onFocus={e => { checkfocus(e); }} readOnly onBlur={(e) => { e.target.setAttribute("Readonly", 'true'); if (end < start) setend(start); }} onChange={(e) => {
          setend(prev => {
            if (e.target.value === '') return Infinity;
            let cur = Number(e.target.value);
            if (!data.length) return cur;
            if (cur < 1) return 1;
            while (cur > data.length) {
              cur = String(cur).substring(1);
              cur = Number(cur);
            }
            return cur;
          });
        }} />

        <button id="calculate" type='submit' onClick={handlerequest}>Get Total Duration</button>
        <p id="result"></p>
        <ShowDetails visibility={showdetail} start={start} end={end} parseISO8601Duration={parseISO8601Duration} formatDuration={formatDuration} data={data} updatetime={updatetime}></ShowDetails>
      </form >
    </div >
  );
}

export default App;