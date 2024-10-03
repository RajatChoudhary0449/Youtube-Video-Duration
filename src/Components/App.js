import './styles.css';
import React, { useEffect, useRef, useState } from 'react'

function App() {
  const [link, changelink] = useState("")
  const [start, setstart] = useState(-1)
  const [end, setend] = useState(Infinity)
  const [data, setdata] = useState([]);
  const inputref = useRef();
  useEffect(() => {
    inputref.current.focus();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const apiKey = process.env.REACT_APP_API_KEY;
      const playlistId = extractPlaylistId(link);
      if (!playlistId) {
        setdata([]);
        return;
      }
      const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=500&playlistId=${playlistId}&key=${apiKey}`;
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
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
      const videoResponse = await fetch(videoDetailsUrl);
      let curdata = await videoResponse.json();
      curdata = curdata.items;
      setdata(curdata);
      if (start !== -1) {
        setstart(-1);
      }
      if (end !== Infinity) {
        setend(Infinity);
      }
    };
    fetchData();
  }, [link]);
  const handlerequest = async () => {
    const startIndex = (start > 0) ? (start - 1) : 0;
    const endIndex = (end === Infinity) ? (end) : (end - 1);
    if (link.length === 0) {
      alert("Link cannot be left empty.");
      return;
    }
    if (!data || !data.length) {
      alert(`Please enter a valid YouTube playlist URL. `);
      return;
    }

    try {
      const totalDuration = await getPlaylistDuration(startIndex, endIndex);
      document.getElementById('result').innerText = `Total Duration: ${formatDuration(totalDuration)}`;
    } catch (error) {
      console.error(error);
      document.getElementById('result').innerText = 'Error fetching playlist duration.';
    }
  }
  function extractPlaylistId(url) {
    const regex = /(?:list=)([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
  async function getPlaylistDuration(startIndex, endIndex) {
    const selectedVideoIds = data.slice(startIndex, endIndex + 1);
    const videoDurations = await getVideoDurations(selectedVideoIds);
    return videoDurations.reduce((total, duration) => total + duration, 0);
  }

  async function getVideoDurations(data) {
    return data.map(item => {
      const duration = item.contentDetails.duration;
      return parseISO8601Duration(duration);
    });
  }

  function parseISO8601Duration(duration) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    const hours = parseInt(matches[1] || 0);
    const minutes = parseInt(matches[2] || 0);
    const seconds = parseInt(matches[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  const handleformrequest = (e) => {
    e.preventDefault();
  }

  const checkfocus = (e) => {
    if (!data.length) {
      if (link !== '')
        alert(`Your playlist is not correct so you cannot go to ${e.target.id} input field , ${link}, ${data}`);
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
        <input type="text" id="link" placeholder="Playlist URL" autoComplete="off" value={link} onChange={(e) => { changelink(e.target.value); }} ref={inputref}></input>

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
        }}></input>

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
        }}></input>

        <button id="calculate" onClick={handlerequest}>Get Total Duration</button>
        <p id="result"></p>
      </form>
    </div >
  );
}

export default App;