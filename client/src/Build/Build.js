import React, { Component } from 'react';

class Build extends Component {
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
        <form onSubmit={this.handleSubmit}>
          <div className="form-group" >
            <label htmlFor="username">Username: </label>
            <input type="text" value={this.state.username} onChange={this.updateUsername} className="form-control" id="username" aria-describedby="emailHelp" placeholder="Enter Username" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input type="email" value={this.state.email} onChange={this.updateEmail} className="form-control" id="email" aria-describedby="emailHelp" placeholder="Enter email" />
            <small id="emailHelp" className="form-text text-muted">We'll send your Mobi Room unique code to your email, bitch.</small>
          </div>
          <div className="form-group">
            <label htmlFor="mobiName">mobiName: </label>
            <input type="mobiName" value={this.state.mobiName} onChange={this.updateMobiName} className="form-control" id="username" aria-describedby="emailHelp" placeholder="Enter Mobi Name" />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      </div>
    );
  }
}

export default Build;
