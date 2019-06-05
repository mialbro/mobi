import React, { Component } from "react";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import PreviewMedia from "../PreviewMedia/PreviewMedia";
import "./Modal.css";

class PopUp extends Component {
  constructor() {
    super();
    this.state = {
      modalShow: false,
      file: null,
      media: {}
    };
  }

  componentDidMount = () => {
    this.props.socket.on("preview-media", data => {
      this.setState({ media: data });
    });

    this.props.socket.on("preview-media-cancel", () => {
      this.setState({ media: {} });
    });
  };

  cancel = () => {
    this.props.socket.emit("cancel-media", this.state.media);
    this.setState({ media: {}, modalShow: false });
  };

  send = () => {
    this.props.socket.emit("show-media", this.state.media);
    this.setState({ media: {}, modalShow: false });
  };

  modalShow = () => {
    this.setState({ modalShow: true });
  };

  submitFile = e => {

    // e.preventDefault();
    const formData = new FormData();
    formData.append(this.props.id, e.target.files[0]);
    //formData.append('user', this.props.id);
    this.props.handleLoading();
    fetch("/upload-file", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(res => {
        this.setState( { media: res, loading: false } );
      })
      .then(res => {
        this.send();
        this.props.handleDone();
      })
      .catch(err => {
        this.props.handleDone();
        console.log("error:", err);
      });
  };

  handleFileUpload = e => {
    e.persist();
    this.setState({ file: e.target.files });
    this.modalShow();
    this.submitFile(e);
  };

  render() {
    const { loading } = this.props;
    const { media } = this.state;
    return (
      <ButtonToolbar disabled={loading}>
        <label className="custom-file-upload" disabled={loading}>
          <input type="file" onChange={this.handleFileUpload} disabled={loading} />
          Upload Media
        </label>
      </ButtonToolbar>
    );
  }
}

export default PopUp;
