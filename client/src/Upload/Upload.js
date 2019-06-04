import React, { Component } from "react";
import axios from "axios";

class Upload extends Component {
  constructor() {
    super();
    this.state = {
      file: null
    };
  }

  submitFile = e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", this.state.file[0]);
    axios
      .post("/test-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then(res => {
        console.log("file uploeded:", res.data);
      })
      .catch(err => {});
  };

  handleFileUpload = e => {
    this.setState({ file: e.target.files });
  };

  render() {
    return (
      <form onSubmit={this.submitFile}>
        <input
          label="upload file"
          name="file"
          type="file"
          onChange={this.handleFileUpload}
        />
        <button type="submit">Send</button>
      </form>
    );
  }
}

export default Upload;
