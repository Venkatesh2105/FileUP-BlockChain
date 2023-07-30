pragma solidity >= 0.5.0;

contract File {
    struct File_{
        string fileHash;
        string fileName;
        string secret;
        string iv;
    }
    struct User{
        mapping(uint => File_) files;
        uint count;    
    }
    mapping(address => User) users;
    function setHash(string memory _fileHash,string memory _fileName,string memory _secret,string memory _iv) public {
        users[msg.sender].files[users[msg.sender].count].fileHash = _fileHash;
        users[msg.sender].files[users[msg.sender].count].fileName = _fileName;
        users[msg.sender].files[users[msg.sender].count].secret = _secret;
        users[msg.sender].files[users[msg.sender].count].iv = _iv;
        users[msg.sender].count++;
    }
    function getHash(uint i, address sender) public view returns (string memory, string memory, string memory, string memory) {
        return (users[sender].files[i].fileHash,users[sender].files[i].fileName, users[sender].files[i].secret, users[sender].files[i].iv);
    }
    function getCount(address sender) public view returns(uint){
        return(users[sender].count);
    }
}