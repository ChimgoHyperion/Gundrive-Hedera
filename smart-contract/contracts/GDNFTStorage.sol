// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// Minimal ERC721 with owner-only mint(address,string)
/// Requires OpenZeppelin contracts (ERC721URIStorage, Ownable)
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GDNFTStorage is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Track tokens owned by each address
    mapping(address => uint256[]) private _ownerTokens;
    // Track token index in owner's array for efficient removal
    mapping(uint256 => uint256) private _tokenIndexes;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        // start token IDs at 1 (optional)
        _tokenIdCounter += 1;
    }

    /// @notice Owner-only mint that sets tokenURI (ipfs://... supported)
    function mint(
        address to,
        string memory tokenURI
    ) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter += 1;
        return tokenId;
    }

    /// Optional convenience: owner can mint multiple in one tx
    function batchMint(
        address[] calldata recipients,
        string[] calldata tokenURIs
    ) external onlyOwner {
        require(recipients.length == tokenURIs.length, "Lengths mismatch");
        for (uint i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            _tokenIdCounter += 1;
        }
    }

    /// @notice Get all token IDs owned by an address
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownerTokens[owner];
    }

    /// @notice Get the number of tokens owned by an address
    function tokenCountOf(address owner) external view returns (uint256) {
        return _ownerTokens[owner].length;
    }

    /// @notice Get token ID at specific index for an owner
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        require(index < _ownerTokens[owner].length, "Index out of bounds");
        return _ownerTokens[owner][index];
    }

    /// Override _update to track ownership changes (OpenZeppelin v5+)
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Call parent implementation first
        address result = super._update(to, tokenId, auth);

        // Update our tracking after the transfer
        if (from != address(0)) {
            // Remove token from previous owner's list
            _removeTokenFromOwner(from, tokenId);
        }

        if (to != address(0)) {
            // Add token to new owner's list
            _addTokenToOwner(to, tokenId);
        }

        return result;
    }

    /// Add token to owner's list
    function _addTokenToOwner(address owner, uint256 tokenId) private {
        _tokenIndexes[tokenId] = _ownerTokens[owner].length;
        _ownerTokens[owner].push(tokenId);
    }

    /// Remove token from owner's list (swap with last element and pop)
    function _removeTokenFromOwner(address owner, uint256 tokenId) private {
        uint256[] storage tokens = _ownerTokens[owner];
        uint256 tokenIndex = _tokenIndexes[tokenId];
        uint256 lastIndex = tokens.length - 1;

        if (tokenIndex != lastIndex) {
            uint256 lastTokenId = tokens[lastIndex];
            tokens[tokenIndex] = lastTokenId;
            _tokenIndexes[lastTokenId] = tokenIndex;
        }

        tokens.pop();
        delete _tokenIndexes[tokenId];
    }
}