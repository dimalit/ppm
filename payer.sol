pragma solidity ^0.5.2;

contract payer{
    
    //address addr0 = address(0x3643465d20dDBcF20477A73d77B2b42f081EB116);
    mapping(address => uint) public address_to_balance;
    mapping(address => address) public address_to_allowance;
    mapping(address => address) public allowance_to_address;
    
    constructor() public {
    }
    
    function() payable external{
        
    }
    
    function deposit() public payable {
        address_to_balance[msg.sender] += msg.value;
    }
    
    function set_allowance(address allowance) public {
        address old_allowance = address_to_allowance[msg.sender];
        if(old_allowance != address(0))
            delete allowance_to_address[old_allowance];
        
        address_to_allowance[msg.sender] = allowance;
        allowance_to_address[allowance] = msg.sender;
    }
    
    function pay(address payable to, uint price) public {
        address from = allowance_to_address[msg.sender];
        require (address_to_balance[from] >= price, "not enough money");
        address_to_balance[from] -= price;
        to.transfer(price);
    }
}
