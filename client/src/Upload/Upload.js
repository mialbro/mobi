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
  drop = (files) => {
    console.log(files);
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
    return (
      <div>
      <input type="file" id="file-input" onChange={this.drop}/>
      <p id="status">Please select a file</p>
      <form method="POST" action="/save-details">
        <input type="hidden" id="avatar-url" name="avatar-url" value=""/>
        <input type="text" name="username" placeholder="Username"/>
        <input type="text" name="full-name" placeholder="Full name"/>
        <input type="submit" value="Update profile"/>
      </form>
      </div>
    );
  }
}

export default Upload;
