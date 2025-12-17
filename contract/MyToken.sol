// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 1_000_000 * 10**18;

    // ✅ 드랍 금액 (예: 1000 토큰)
    uint256 public faucetAmount = 1000 * 10**18;

    // ✅ 한 주소 1회 제한 (원하면 조건 바꿔도 됨)
    mapping(address => bool) public claimed;

    event Claimed(address indexed user, uint256 amount);
    event FaucetAmountUpdated(uint256 amount);

    constructor(address initialOwner) ERC20("MyToken", "MTK") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    // ✅ 누구나 신청(클레임)하면 owner 잔액에서 자동 지급
    function claim() external {
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;

        require(balanceOf(owner()) >= faucetAmount, "Owner has insufficient balance");
        _transfer(owner(), msg.sender, faucetAmount);

        emit Claimed(msg.sender, faucetAmount);
    }

    function setFaucetAmount(uint256 amount) external onlyOwner {
        faucetAmount = amount;
        emit FaucetAmountUpdated(amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
