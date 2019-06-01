import React, { Component } from "react";
import Jumbotron from "react-bootstrap/Jumbotron";

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: []
    };
  }

  allowDrop = (e) => {
    e.preventDefault();
  }

  // handle file upload
  drop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const file = files[0];
    if (file === null)
      return alert('No file selected');
    this.getSignedRequest(file);
  }

  getSignedRequest = (file) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4){
        if(xhr.status === 200){
          const response = JSON.parse(xhr.responseText);
          this.uploadFile(file, response.signedRequest, response.url);
        }
        else{
          alert('Could not get signed URL.');
        }
      }
    };
    xhr.send();
  }



  uploadFile = (file, signedRequest, url) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {

        }
        else {
          alert('Could not upload file');
        }
      }
    };
    xhr.send(file);
  }


  render() {
    console.log(this.props);
    return (
      <Jumbotron
        fluid style={{ marginTop: "1em" }}
        onDragOver={this.allowDrop}
        onDrop={this.drop}
      >
      <input type="file" id="file-input" onChange={this.drop}>
      <p id="status">Please select a file</p>
      <img id="preview" src="">
      <form method="POST" action="/save-details">
      <input type="hidden" id="avatar-url" name="avatar-url" value="/images/default.png">
      <input type="text" name="username" placeholder="Username"><br>
      <input type="text" name="full-name" placeholder="Full name"><br><br>
      <input type="submit" value="Update profile">
      </form>
      </Jumbotron>
    );
  }
}

export default Upload;
