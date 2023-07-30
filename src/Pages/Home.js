import React, { Component } from 'react';
import Web3 from 'web3';
import './Home.css';
import File from '../abis/File.json'
import imgTemp from '../assets/image.PNG'
import fileTemp from '../assets/file.PNG'
import add from '../assets/add.png';
import close from '../assets/close.png';
import emptybox from '../assets/empty-box.png';
import floatlogo from '../assets/floatlogo.jpeg';
import Upload from './Upload'
import { decode } from 'base64-arraybuffer';

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: '',
            buffer: null,
            contract: null,
            pop: 'none',
            show: true,
            fileName: '',
            fileHash: '',
            id: '-1',
            secret: '',
            iv: ''
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
            const count = await contract.methods.getCount(this.state.account).call();
            const file = [];
            for (let i = 0; i < count; i++) {
                const file_ = await contract.methods.getHash(i, this.state.account).call();
                file.push({
                    fileHash: file_[0],
                    fileName: file_[1],
                    secret: file_[2],
                    iv: file_[3]
                });
            }
            this.setState({ file });
        } else {
            window.alert('Smart contract not deployed to detected network');
        }
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
    //Import Key
    async AES_keyImport(rawKey) {
        const key = await window.crypto.subtle.importKey(
            "raw",
            new Uint8Array(decode(rawKey)),
            "AES-CBC",
            true,
            ["encrypt", "decrypt"]
        );
        return key;
    }
    //Decrypt
    async AES_Decrypt(ciphertext_) {
        console.log("Decrypting Data...");

        const key = await this.AES_keyImport(this.state.secret);
        const iv = decode(this.state.iv);

        let decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv
            },
            key,
            ciphertext_
        );

        let dec = new TextDecoder();
        const plaintext = dec.decode(decrypted);
        console.log("Data Decryption successful...");
        return plaintext;
    }
    async download(result) {
        var arr = result.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const fileURL = window.URL.createObjectURL(new Blob([u8arr], { type: mime }));
        let alink = document.createElement('a');
        alink.href = fileURL;
        alink.download = this.state.fileName;
        alink.click();
    }

    handleClick = (e) => {
        if (this.state.pop === "none")
            this.setState({ pop: "flex" });
        else
            this.setState({ pop: "none" });
    };

    fileClick = (e) => {
        if (this.state.id === '-1') {
            this.setState({ show: !this.state.show });

        }
        else {
            if (this.state.id === e.target.getAttribute("id")) {
                this.setState({ show: !this.state.show });
                this.setState({ id: '-1' });
                return;
            }
        }
        const id = e.target.getAttribute("id");
        this.setState({ fileName: this.state.file[id].fileName });
        this.setState({ fileHash: this.state.file[id].fileHash });
        this.setState({ secret: this.state.file[id].secret });
        this.setState({ iv: this.state.file[id].iv });
        this.setState({ id: id });
    };
    res = (e) => {
        this.setState({ show: !this.state.show });
        this.setState({ id: '-1' });
        this.setState({ fileName: '' });
        this.setState({ fileHash: '' });
        this.setState({ secret: '' });
        this.setState({ iv: '' });
    };
    onButtonClick = () => {
        let r = false;
        if (this.state.secret === '')
            r = false;
        else
            r = true;
            console.log("Fetching data from CID...");
            fetch('https://fileup.infura-ipfs.io/ipfs/' + this.state.fileHash).then(response => {
                console.log("Data fetched successfully and processing the data...");
                response.text().then((result) => {
                    if (r) {
                        console.log("RAW data entered for decryption...");
                        const temp = decode(result);
                        this.AES_Decrypt(temp).then((res) => {
                            console.log("Preparing download...");
                            this.download(res).then((resl) => {
                                console.log("Download successful...");
                            });
                        });
                    }
                    else {
                        console.log("Preparing download...");
                        this.download(result).then(() => {
                            console.log("Download successful...");
                        });
                    }
                });
            });
    }

    render() {
        const img_ext = ['jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'png', 'gif', 'webp', 'tiff', 'tif', 
                         'psd', 'raw', 'arw', 'cr2', 'nrw', 'k25', 'bmp', 'dib', 'heif', 'heic', 'ind', 
                         'indd', 'indt', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm', 'mj2', 'svg', 'svgz', 'ai', 'eps'];

        const files = this.state.file?.map((data, id) => {
            const ext = data.fileName.toLowerCase().split('.')[1];
            let srcImg = fileTemp;
            if (img_ext.includes(ext)) {
                srcImg = imgTemp;
            }

            return <div className="focusWrapper" id={id} key={id} onClick={this.fileClick}>
                <div className="focusCenter" id={id}>
                    {<img className="focusImg" src={srcImg} id={id} alt="" />}
                </div>
                <a className="nLink" href={"https://fileup.infura-ipfs.io/ipfs/" + data.fileHash} target="_blank" rel="noopener noreferrer">
                    <div className="FocusBottomLeft">
                        <span className="focusName">
                            {data.fileName}
                        </span>
                        <span className="focusText">

                        </span>
                    </div>
                </a>
            </div>
        });
        return (
            <div className="container_">
                <img className="floatlogo" src={floatlogo} alt="Logo" />
                <div className="fileVcont" style={{
                    zIndex: this.state.show ? 0 : 1
                }}>
                    <div className="col-sm-8 fileView" style={{
                        opacity: this.state.show ? 0 : 1,
                    }}>
                        <img src={close} className="close fil" alt="close" height="55px" onClick={this.res} />

                        <div className="file_con">
                            {this.state.fileName}
                            <button onClick={this.onButtonClick}>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
                <div className="acc_" style={{ display: this.state.pop }}>
                    <div className="col-sm-8 upload_con">
                        <img src={close} className="close up" alt="close" height="55px" onClick={this.handleClick} />
                        <Upload></Upload>
                    </div>
                </div>
                <div className="acc">
                    <img src={add} className="act_bar" alt="add" height="55px" onClick={this.handleClick} />
                </div>
                <ul className="navbar-nav px-3">
                    <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
                        <small className="text-black"><strong>Account
                            Connected:</strong> {this.state.account.length > 0 ? this.state.account : "Not Connected!"}
                        </small>
                    </li>
                </ul>
                <div className="row cont">
                    <div className="col-sm-8 fileCont">
                        <div className="fileFocus">
                            {this.state.file?.length > 0 ?
                                files :
                                <img src={emptybox} className="empty" alt="empty" />
                                }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Home;