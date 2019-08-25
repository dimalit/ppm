//var PAY_CONTRACT_ADDR = "0x8de2a12e9bd1f421c4b1afed72f3f762bb48f743";
var PAY_CONTRACT_ADDR = "0xc2f4a9ee58ab56af14aa35e427238c303421b0dd";

function acc0_is_present(addr1){
	var key = addr1+"/acc0";
	acc0 = localStorage.getItem(key);
	return !!acc0;
}

function generate_or_load_acc0(addr1, web3){
	var key = addr1+"/acc0";
	acc0 = localStorage.getItem(key);
	if(acc0){
		acc0 = web3.eth.accounts.privateKeyToAccount(JSON.parse(acc0).privateKey);
		console.log("(loaded private key)");
	}
	else{
		acc0 = web3.eth.accounts.create();
		console.log("(created anew)");
	}
	localStorage.setItem(key, JSON.stringify(acc0));
	return acc0;
}

function ppm_init(pay_callback, fail_callback){

	var g_pay_callback = pay_callback;
	var g_fail_callback = fail_callback;	
	
	var ethereum;
	if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
		  ethereum = window['ethereum'] || window.web3.currentProvider;
	}
	window.myethereum = ethereum;

	var _ppm_pay;
	var _ppm_set_allowance;
	
	var g_current_address = '';
	var g_current_price = 0;
	
	ppm_navigate = function(addr, price){
		g_current_address = addr;
		g_current_price = price;
		console.log("Navigated to " + addr + " with price " + price);
	}
	
	if(!ethereum || !ethereum.isMetaMask){
		alert("Please install Metamask!");
		return;
	}
	
	return ethereum.enable().then(function(addr1){
		var g_addr1 = addr1[0];
		console.log("User main account address = " + g_addr1);

		var web3 = new Web3(ethereum);
		window.myweb3 = web3;
	
		var g_acc0_present = acc0_is_present(g_addr1);
		g_acc0 = generate_or_load_acc0(g_addr1, web3);
		g_addr0 = g_acc0.address;
		g_pr0   = g_acc0.privateKey;
		console.log("Generated 'zero' account " + g_addr0);
		
		setTimeout(function(){
			if(!g_current_address)
				return;
			_ppm_pay(g_current_address, g_current_price);
		}, 6000);	
		
		// TODO restart each navigation
		setInterval(function(){
			if(!g_current_address)
				return;
			_ppm_pay(g_current_address, g_current_price);
		}, 60000);		
		
		payer_contract = new web3.eth.Contract([
			{
				"constant": true,
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"name": "address_to_allowance",
				"outputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"name": "address_to_balance",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"name": "allowance_to_address",
				"outputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"internalType": "address payable",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "price",
						"type": "uint256"
					}
				],
				"name": "pay",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [],
				"name": "deposit",
				"outputs": [],
				"payable": true,
				"stateMutability": "payable",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"internalType": "address",
						"name": "allowance",
						"type": "address"
					}
				],
				"name": "set_allowance",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "constructor"
			},
			{
				"payable": true,
				"stateMutability": "payable",
				"type": "fallback"
			}
		], PAY_CONTRACT_ADDR);
		
		_ppm_pay = function(addr, amount){
			var data = payer_contract.methods.pay(addr, amount).encodeABI();
			web3.eth.getTransactionCount(g_addr0).then(function(nonce){
				json = {
					from: g_addr0,
					to: PAY_CONTRACT_ADDR,
					value: 0,
					data: data,
					gas: 1000000,
					gasPrice: 0,
					nonce: nonce
				};
				//console.log(nonce);
				g_acc0.signTransaction(json).then(function(tx){
					//console.log(tx);
					web3.eth.sendSignedTransaction(tx.rawTransaction).then(function(res){
						//console.log(res);
						g_pay_callback(addr, amount);
					}).catch(function(err){
						console.log(err.revertReason);
						g_fail_callback(addr, amount);
					});	
				});
			});
		}// _ppm_pay
		
		_ppm_set_allowance = function(allowance){
			var data = payer_contract.methods.set_allowance(allowance).encodeABI();
			web3.eth.getTransactionCount(g_addr1).then(function(nonce){
				json = {
					from: g_addr1,
					to: PAY_CONTRACT_ADDR,
					value: 0,
					data: data,
					gas: 1000000,
					gasPrice: 0,
					nonce: nonce
				};
				//console.log(tx);
				web3.eth.sendTransaction(json).then(function(res){
					g_acc0_present = true;
				}).catch(function(err){
					console.log(err.revertReason);
				});
			});
		}// ppm_deposit
		
		ppm_deposit = function(value){
			var data = payer_contract.methods.deposit().encodeABI();
			web3.eth.getTransactionCount(g_addr1).then(function(nonce){
				json = {
					from: g_addr1,
					to: PAY_CONTRACT_ADDR,
					value: value,
					data: data,
					gas: 1000000,
					gasPrice: 0,
					nonce: nonce
				};
				
				web3.eth.sendTransaction(json).then(function(res){
					console.log(res);
				}).catch(function(err){
					console.log(err.revertReason);
				});
			});
		}// ppm_deposit
		
		ppm_balance = function(){
			return payer_contract.methods.address_to_balance(g_addr1).call();
		}
		
		ppm_receiver = function(){return g_current_address;}
		ppm_rate = function(){return g_current_price;}
	
		ppm_has_allowance = function(){return g_acc0_present;}
		ppm_set_allowance = function(){
			if(!g_acc0_present){
				_ppm_set_allowance(g_addr0);
			}// register
		}
		
	});// enable	
}

var ppm_deposit;
var ppm_balance;
var ppm_navigate;

var ppm_has_allowance;
var ppm_set_allowance;

var ppm_receiver;
var ppm_rate;