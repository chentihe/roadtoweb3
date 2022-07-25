// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract ExampleExternalContract {

  bool public completed;
  address public whitelist;

  function complete() public payable {
    completed = true;
  }

  function setWhitelist(address _address) public {
    whitelist = _address;
  }

  function redeposit(address _address) external {
    require(whitelist == msg.sender, "You are not allow to call this function!");
    (bool sent, bytes memory data) = _address.call{value: address(this).balance}("");
    require(sent, "receiver rejected ETH transfer");
  }
}
