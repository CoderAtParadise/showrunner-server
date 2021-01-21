import logo from './logo.svg';
import React from 'react'
import './App.css';

class Echo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {messages: []}
  }

  componentDidMount(){
    // this is an "echo" websocket service
    this.connection = new WebSocket('ws://localhost:3001');
    this.connection.onclose = e=> {};
    this.connection.onerror = e => {};
    if(this.connection.readyState === WebSocket.OPEN) {
    // listen to onmessage event
    this.connection.onmessage = evt => { 
      // add the new message to state
        this.setState({
        messages : this.state.messages.concat([ evt.data ])
      })
    };

    // for testing purposes: sending to the echo service which will send it back back
    setInterval( _ =>{
        this.connection.send( Math.random() )
    }, 1000 )
  } else {
    console.log("No connection");
  }
  }

  render() {
    // slice(-5) gives us the five most recent messages
    return <ul>{ this.state.messages.slice(-5).map( (msg, idx) => <li key={'msg-' + idx }>{ msg }</li> )}</ul>;
  }
};

class ShowTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {time:""};
  }

  componentDidMount() {
    
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <Echo/>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
