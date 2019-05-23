import React, { Component } from 'react';

class Start extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 'Please write an essay about your favorite DOM element.'
    };
  }

  handleClick = (e) => {
    this.props.update(e.target.value);
  }

  render() {
    return (
      <div>
        <button type="button" onClick={this.handleClick} value='build' className="btn btn-primary btn-lg btn-block">Build Room</button>
        <button type="button" onClick={this.handleClick} value='enter' className="btn btn-secondary btn-lg btn-block">Enter Room</button>
      </div>
    );
  }
}

export default Start;
