// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenFaucet is Ownable {
    IERC20 public immutable token;
    uint256 public dripAmount;

    mapping(address => bool) public claimed; // 1인 1회

    event Claimed(address indexed user, uint256 amount);

    constructor(address tokenAddress, uint256 _dripAmount)
        Ownable(msg.sender)
    {
        token = IERC20(tokenAddress);
        dripAmount = _dripAmount;
    }

    function claim() external {
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;

        require(token.transfer(msg.sender, dripAmount), "Transfer failed");
        emit Claimed(msg.sender, dripAmount);
    }

    function setDripAmount(uint256 _dripAmount) external onlyOwner {
        dripAmount = _dripAmount;
    }
}
