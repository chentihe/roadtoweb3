const qs = require("qs");
const BigNumber = require("bignumber.js");

let currentTrade = {};
let currentSelectSide;

const init = async () => {
    listAvailableTokens();
}

const listAvailableTokens = async () => {
    console.log("initializing");
    let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
    let tokenListJSON = await response.json();
    console.log("listing available tokens:", tokenListJSON);
    tokens = tokenListJSON.tokens;
    console.log(tokens);
    
    // Create a token list for the modal
    let parent = document.getElementById("token_list");
    // Loop through all the tokens inside the token list JSON object
    for (const i in tokens) {
        // Create a row for each token in the list
        let div = document.createElement("div");
        div.className = "token_row";
        // For each row, display the token image and symbol
        let html = `
        <img class="token_list_img" src="${tokens[i].logoURI}">
          <span class="token_list_text">${tokens[i].symbol}</span>
        `;
        div.innerHTML = html;
        div.onclick = () => {
            selectToken(tokens[i]);
        };
        parent.appendChild(div);
    }
}

const selectToken = (token) => {
    // When a token is selected, automatically close the modal
    closeModal();
    // Track which side of the trade we are on - from/to
    currentTrade[currentSelectSide] = token;
    // Log the selected token
    console.log("currentTrade:", currentTrade);
    renderInterface();
}

const renderInterface = () => {
    if (currentTrade.from) {
        console.log(currentTrade.from);
        // Set the from token image
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        // Set the from token symbol text
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }
    if (currentTrade.to) {
        console.log(currentTrade.to);
        // Set the to token image
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        // Set the to token symbol text
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }

}

const getSellPrice = async () => {
    console.log("Getting Price");
    // only fetch price if from token, to token, and from token amount have been filled in
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    // The amount is calculated from the smallest base unit of the token. We get this by multiplying the (from amount) x (10 to the power of the number of decimal places)
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount
    }
    // Fetch the swap price.
    const response = await fetch(
        `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );

    // Await and parse the JSON response
    swapPriceJSON = await response.json();
    console.log("Price:", swapPriceJSON);
    // Use the returned values to populate the buy Amount and the estimated gas in the UI
    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas * swapPriceJSON.gasPrice / (10 ** 18) + " ether";
}

const getBuyPrice = async () => {
    console.log("Getting Price");
    // only fetch price if from token, to token, and from token amount have been filled in
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    // The amount is calculated from the smallest base unit of the token. We get this by multiplying the (from amount) x (10 to the power of the number of decimal places)
    let amount = Number(document.getElementById("to_amount").value * 10 ** currentTrade.to.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        buyAmount: amount
    }
    // Fetch the swap price.
    const response = await fetch(
        `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );

    // Await and parse the JSON response
    swapPriceJSON = await response.json();
    console.log("Price:", swapPriceJSON);
    // Use the returned values to populate the buy Amount and the estimated gas in the UI
    document.getElementById("from_amount").value = swapPriceJSON.sellAmount / (10 ** currentTrade.from.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

const getQuote = async (account) => {
    console.log("Getting Quote");
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
        takerAddress: account
    }
    // Fetch the swap price.
    const response = await fetch(
        `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    );

    // Await and parse the JSON response
    swapQuoteJSON = await response.json();
    console.log("Price:", swapQuoteJSON);
    // Use the returned values to populate the buy Amount and the estimated gas in the UI
    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;

    return swapQuoteJSON;
}

const trySwap = async () => {
    // The address, if any, of the most recently used account that the caller is permitted to access
    let accounts = await ethereum.request({ method: "eth_accounts" });
    let takerAddress = accounts[0];
    // Log the most recently used address in our Metamask wallet
    console.log("takerAddress:", takerAddress);
    // Pass this as the account param into getQuote() we built out earlier. This will return a JSON object trade order.
    const swapQuoteJSON = await getQuote(takerAddress);
    
    // Setup the erc20abi in json format so we can interact with the approve method below
    const erc20abi = [
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
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
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
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
                    "name": "_from",
                    "type": "address"
                },
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
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
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "balance",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
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
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "name": "_spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ];
    // Setup approval amount for the token we want to trade from
    const fromTokenAddress = currentTrade.from.address;
    // In order for us to interact with a ERC20 contract's method's, need to create a web3 object. This web3.eth.Contract object needs a erc20abi which we can get from any erc20 abi as well as the specific token address we are interested in interacting with, in this case, it's the fromTokenAddrss
    // Read More: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#web3-eth-contract
    const web3 = new Web3(Web3.givenProvider);
    const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
    console.log("setup ERC20TokenContract:", ERC20TokenContract);
	
    // Grant the allowance target (the 0x Exchange Proxy) an allowance to spend out tokens. Note that this is a txn that incurs fees.
    const currentAllowance = new BigNumber(
        ERC20TokenContract.methods.allowance(takerAddress, swapQuoteJSON.allowanceTarget).call()
    );
    if (currentAllowance.isLessThan(swapQuoteJSON.sellAmount)) {
        const tx = await ERC20TokenContract.methods
        .approve(swapQuoteJSON.allowanceTarget, swapQuoteJSON.sellAmount)
        .send({from: takerAddress})
        .then(tx => {
            console.log("tx: ", tx);
        });
    }

    // Perform the swap
    const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
    console.log("receipt:", receipt);
}

const filterTokenList = (event) => {
    const search = event.target.value.toLowerCase();
    const tokenList = document.querySelectorAll("#token_list > div");
    tokenList.forEach((token) => {
        const symbol = token.getElementsByTagName("span")[0].innerText.toLowerCase();
        symbol.startsWith(search) ? token.style.display = "block" : token.style.display = "none";
    });
}

const connect = async () => {
/** MetaMask injects a global API into websites visited by its users at `window.ethereum`. This API allows websites to request users' Ethereum accounts, read data from blockchains the user is connected to, and suggest that the user sign messages and transactions. The presence of the provider object indicates an Ethereum user. Read more: https://ethereum.stackexchange.com/a/68294/85979**/

// Check if MetaMask is installed, if it is, try connecting to an account
    if (typeof window.ethereum !== "undefined") {
        try {
            console.log("connecting");
            // Requests that the user provides an Ethereum address to be identified by. The request causes a MetaMask popup to appear. Read more: https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
            await ethereum.request({ method: "eth_requestAccounts"});
        } catch (error) {
            console.log(error);
        }
        // If connected, change button to "Connected"
        document.getElementById("login_button").innerHTML = "Connected";
        // If connected, enable "Swap" button
        document.getElementById("swap_button").disabled = false;
    } else {
        document.getElementById("login_button").innerHTML = "Please install Metamask";
    }
}

const openModal = (side) => {
    // Store whether the use has selected a token on the from or to side
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

const closeModal = () => {
    document.getElementById("token_modal").style.display = "none";
}

init();

// Call the connect function when the login_button is clicked
document.getElementById("login_button").onclick = connect;

document.getElementById("from_token_select").onclick = () => {
    openModal("from");
};
document.getElementById("from_amount").onblur = getSellPrice;
document.getElementById("to_amount").onblur = getBuyPrice;
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("swap_button").onclick = trySwap;
document.getElementById("search_token").onkeyup = filterTokenList;