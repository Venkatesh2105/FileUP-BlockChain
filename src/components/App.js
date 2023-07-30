import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../Pages/Home";
class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: ''
        }
    }

    async componentWillMount() {
        await this.loadWeb3();
    }


    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        }
        if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert('Please install MetaMask!')
        }
    }
  render() {
    return (
        <div id="in">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </BrowserRouter>
        </div>

    );
  }
}

export default App;
