pragma solidity >=0.5.0 <0.6.0;


contract DataRepo {

    event HashStored(address indexed _hashSender, uint _hashId, bytes32 _hashContent, uint timestamp);

    enum EventType { Add, Modify, Remove}

    struct Hash {
        address sender;
        bytes32 contentHash;
        uint timestamp;
        EventType eventType;
    }

    // bytes[] private ipfsHashes;

    mapping(uint => Hash) public hashes;
    uint public lastHashId;


    function save(bytes32 _hash) public returns (uint) {

        uint hashId = ++lastHashId;
        hashes[hashId].sender = msg.sender;
        hashes[hashId].contentHash = _hash;
        hashes[hashId].timestamp = block.timestamp;
        hashes[hashId].eventType = EventType.Add;

        emit HashStored(hashes[hashId].sender, hashId, hashes[hashId].contentHash, hashes[hashId].timestamp);

        return hashId;
    }


   /**
  * @dev find hash by id
  * @param _hashId Hash Id
  */
  function find(uint _hashId) public view returns (address hashSender, bytes32 hashContent, uint hashTimestamp) {
    return (hashes[_hashId].sender, hashes[_hashId].contentHash, hashes[_hashId].timestamp);
  }

}