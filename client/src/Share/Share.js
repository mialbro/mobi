import React, { Component } from 'react';

class Share extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      username: '',
      mobiName: ''
    };
  }

  handleSubmit = (e) => {
    let room = this.state;
    this.props.socket.emit('create mobi', room);
    this.props.socket.on('new mobi', (mobi) => {
      console.log('new mobi', mobi);
      this.props.handleNewMobi(mobi);
    });
    e.preventDefault();
  }

  updateUsername = (e) => {
    e.persist();
    this.setState((state, props) => ({
      username: e.target.value
    }));
  }

  updateMobiName = (e) => {
    e.persist();
    this.setState((state, props) => ({
      mobiName: e.target.value
    }));
  }

  updateEmail = (e) => {
    e.persist();
    this.setState({email: e.target.value});
  }


  render() {
    return (
      <div>
        <div>
          <h1>Room Name: </h1>
          <p>{this.props.mobiName}</p>
        </div>
        <div>
          <h1>Username: </h1>
          <p>{this.props.username}</p>
        </div>
        <div>
          <h1>Room Code: </h1>
          <p>{this.props.code}</p>
        </div>
        <div>
          <button type="button" onClick={this.props.handleClick} value='build' className="btn btn-primary btn-lg btn-block">Enter Room</button>
        </div>
      </div>
    );
  }
}

export default Share;
