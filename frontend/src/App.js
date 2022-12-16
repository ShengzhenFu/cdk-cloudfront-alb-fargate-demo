// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
import React, { useState } from 'react';

function App() {

  const [number, setNumber] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = `https://yourDomainName/generate/${number}`
    let myHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Content-Type': 'application/json'
  });
    //const url = 'https://random-word-api.herokuapp.com/word'
    // fetch(
    //   `http://localhost:9090/generate/${number}`, { method: 'GET', mode: 'no-cors'}
    // )
    //   .then(response => {
    //     return response.json();
    //   })
    //   .then(data => {
    //     setResult(data.output)
    //     setNumber("");
    //   })
    //   .catch(error => {
    //     console.log(`Error in fetching backend api ${error}`);
    //   });
    try {
      let res = await fetch(url, { mode:'cors', headers: myHeaders });
    
      let data = await res.json();
      setResult(data.output)
      setNumber("")
      console.log(`${data}`)
      
    } catch (error) {
      console.log(`Error in fetching backend api ${error}`)
    }
  };

  return (
    <div className="App">
      <h2>Fibonacci Generator 1.0v</h2>
      <hr />
      <form onSubmit={handleSubmit}>
        <label>Number: </label>
        <input type="text" onChange={(e) => setNumber(e.target.value)} />
        <button type="submit">Generate</button>
        <hr />
        <h2>Result: { result }</h2>
      </form>
    </div>
  );
}

export default App;