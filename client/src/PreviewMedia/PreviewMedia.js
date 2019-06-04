import React, { Component } from "react";
import Message from "../Message";

class PreviewMessage extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return <div />;
  }
}

export default PreviewMessage;
