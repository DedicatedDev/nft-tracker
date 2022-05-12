// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract EVMBridge {
  IERC1155 erc1155;
  IERC721 erc721;

  enum ContractType {
    erc1155,
    erc721
  }

  function moveAssetToPostchain(
    address tokenContract,
    ContractType contracType,
    uint256 tokenId
  ) external {
    _burn(msg.sender, tokenContract, contracType, tokenId);
  }

  function _burn(
    address from,
    address _tokenContract,
    ContractType _contracType,
    uint256 _tokenId
  ) internal {
    if (_contracType == ContractType.erc721) {
      erc721 = IERC721(_tokenContract);
      erc721.safeTransferFrom(from, address(0), _tokenId);
    } else {
      erc1155 = IERC1155(_tokenContract);
      //erc1155.safeTransferFrom(from, address(0), _tokenId);
    }
  }
}
