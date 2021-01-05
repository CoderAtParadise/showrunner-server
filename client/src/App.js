import logo from './logo.svg';
import './App.css';
import React from 'react';
import {BrowserRouter as Router,Route,Link, Redirect,useLocation, useHistory,withRouter} from 'react-router-dom';

class Campus
{

}

class LoginForm extends React.Component
{
  constructor(props)
  {
    super(props);
    this.username = "";
    this.password = "";
    this.state = {login: false};
  }

  render()
  {
    const {login} = this.state;
    if(login)
    return(<div><Redirect to={"/"}/></div>)
  }
}

function runsheet(params) {
  
}


function Nav(props)
{
  return(
    <div className = "nav">
      <aside>
        <Link to={'/'}>Home<span > | </span></Link>
        <Link to={'/runsheet'}>Runsheet</Link>
      </aside>
    </div>
  )
}

function App() {
  return (
    <Router>
    <div className="App">
     {/*<LoginForm/>*/}
     <Nav/>
    </div>
    </Router>
  );
}

function timer() {
  
}

export default App;
