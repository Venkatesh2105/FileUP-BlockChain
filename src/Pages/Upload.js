import React, { Component } from 'react';
import Web3 from 'web3';
import './Upload.css';
import File from '../abis/File.json'
import { create, IPFSHTTPClient } from "ipfs-http-client";
import { encode } from 'base64-arraybuffer';

// IPFS http code
const projectId = '2GGrPVPK7M6XYbWBzrX6GzKefIH';
const projectSecret = 'a8314de9cffa57989e80a363f66981d5';
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
let ipfs = IPFSHTTPClient | undefined;

/*create({
url: "https://ipfs.infura.io:5001/api/v0",
headers: {
    authorization,
},
}); // leaving out the arguments will default to these values
*/

class Upload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: '',
            buffer: null,
            contract: null,
            fileHash: "QmP6pC8uF4G2RKBPhScqMe1BcZ3Le4Ezx5oXx94Xz2cGeB",
            logHash: "QmP6pC8uF4G2RKBPhScqMe1BcZ3Le4Ezx5oXx94Xz2cGeB",
            fileName: "",
            fileStatus: "Not Uploaded",
            mode: false
        }
        try {
            ipfs = create({
                url: "https://ipfs.infura.io:5001/api/v0",
                headers: {
                    authorization,
                },
            });
        } catch (error) {
            console.error("IPFS error ", error);
            ipfs = undefined;
        }
    }

    async componentWillMount() {
        await this.loadWeb3();
        await this.loadBlockChainData();
    }

    async loadBlockChainData() {
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        this.setState({ account: accounts[0] });
        const networkId = await web3.eth.net.getId();
        const networkData = File.networks[networkId];
        if (networkData) {
            const abi = File.abi;
            const address = networkData.address;
            // Fetch smart contract
            const contract = web3.eth.Contract(abi, address);
            this.setState({ contract });
            const logHash = "QmZhwCrQxu6gAQ3t1rTm3pshnSz2u1VxerzsSuAMrB1Lcm";
            this.setState({ logHash });
        } else {
            window.alert('Smart contract not deployed to detected network');
        }
    }
    //Key Preparation
    async AES_keyPrep() {
        let key = await window.crypto.subtle.generateKey(
            {
                name: "AES-CBC",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
        let iv = await window.crypto.getRandomValues(new Uint8Array(16));
        this.setState({ key });
        this.setState({ iv });
    }
    //Export Key
    async AES_keyExport() {
        const exported = await window.crypto.subtle.exportKey(
            "raw",
            this.state.key
        );
        const key = encode(new Uint8Array(exported));
        return key;
    };
    //Encryption
    async AES_Encrypt(buffer) {
        //Test Run
        await this.AES_keyPrep();
        let enc = new TextEncoder();
        const data = enc.encode(buffer);
        const key = this.state.key;
        const iv = this.state.iv;
        //Encrypt Data
        console.log("Encrypting Data...");
        const ciphertext_ = await window.crypto.subtle.encrypt(
            {
                name: "AES-CBC",
                iv
            },
            key,
            data
        );
        console.log("Data Encryption successful...");
        return ciphertext_;
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
    async cloudUpload() {
        //Add file to ipfs
        ipfs.add(this.state.buffer).then((result) => {
            console.log("File hash successful...");
            const hash = result.path;
            const name = this.state.fileName;
            let key = '';
            let iv = '';
            if (this.state.mode) {
                this.AES_keyExport().then((result) => {
                    key = result;
                    iv = encode(this.state.iv);
                    console.log("Keys Exported successfully...");
                    this.storeChain(hash, name, key, iv).then();
                });
            }
            else
                this.storeChain(hash, name, key, iv).then();
        });
    }
    async storeChain(hash, name, key, iv) {
        // Store file on Blockchain
        this.state.contract.methods.setHash(hash, name, key, iv).send({ from: this.state.account }).on("confirmation", (r) => {
            this.setState({ fileHash: hash });
            this.setState({ fileStatus: "File Uploaded Successfully" });
            console.log("File uploaded successfully...");
        });
    }
    captureFile = (e) => {
        e.preventDefault();
        console.log("file reading...");

        //Process file for ipfs
        try {
            let file = e.target.files[0];
            const reader = new window.FileReader();
            reader.onloadend = () => {
                this.setState({ buffer: reader.result });
                this.setState({ fileName: file.name });
            };
            reader.readAsDataURL(file);
            this.setState({ fileStatus: "File Captured" });
        }
        catch (err) {
            this.setState({ fileStatus: "Not Uploaded" });
            console.log("Error");
        }
    };

    // Example hash: "QmPpNuwSi9ctTHTafxkFQ5tGASfRqmmxhgdiYbbUqNeeWD"
    // Example url: https://ipfs.infura.io/ipfs/QmPpNuwSi9ctTHTafxkFQ5tGASfRqmmxhgdiYbbUqNeeWD
    onSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting form...");
        if (this.state.mode) {
            console.log("File processing in enc mode...");
            console.log(this.state.mode);
            this.AES_Encrypt(this.state.buffer).then((result) => {
                this.setState({ buffer: encode(result) });
                this.setState({ fileStatus: "Uploading File" });
                this.cloudUpload();
            });
        }
        else {
            this.setState({ fileStatus: "Uploading File" });
            this.cloudUpload();
        }
    };

    changeMode = (e) => {
        e.preventDefault();
        console.log("Mode changed...");
        this.setState({ mode: !this.state.mode });
    };

    render() {
        return (
            <div>
                <div className="container-fluid mt-5">
                    <div className="row">
                        <main role="main" className="col-lg-12 d-flex text-center mainCont">
                            <div className="content">
                                <img className="contImg" src={'https://fileup.infura-ipfs.io/ipfs/' + this.state.logHash} width="400px" alt="null" />
                                <div>
                                    <small className="text-black"><strong> File Status:</strong> {this.state.fileStatus}&nbsp;&nbsp;</small>
                                    <h2>Select Image</h2>
                                    <form onSubmit={this.onSubmit}>
                                        <input type="file" onChange={this.captureFile} className="chose-button" />
                                        <label className="premium-button">
                                            <input type="file" onChange={this.captureFile} />
                                            Chose File
                                        </label>
                                        <input type="submit" className="premium-button" />
                                    </form>
                                    <label className="switch">
                                        <input type="checkbox" onInput={this.changeMode} />
                                        <span className="slider round"></span>
                                    </label>
                                    <h3>Encryption</h3>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }
}

export default Upload;
