import Web3 from 'web3';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenContract, recipientAddress, amount } = req.body;
    
    // ТВОИ КЛЮЧИ из Vercel Environment Variables
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const SENDER_ADDRESS = process.env.SENDER_ADDRESS;
    
    // НОВЫЙ СИНТАКСИС Web3
    const web3 = new Web3('https://polygon-rpc.com');
    
    const ERC20_ABI = [
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
      }
    ];

    const token = new web3.eth.Contract(ERC20_ABI, tokenContract);
    const decimals = await token.methods.decimals().call();
    const decimalsNumber = Number(decimals);
    const amountWei = BigInt(Math.floor(amount * Math.pow(10, decimalsNumber))).toString();
    
    const nonce = await web3.eth.getTransactionCount(SENDER_ADDRESS, 'pending');
    const gasPrice = await web3.eth.getGasPrice();
    
    const transaction = {
      from: SENDER_ADDRESS,
      to: tokenContract,
      data: token.methods.transfer(recipientAddress, amountWei).encodeABI(),
      gas: 100000,
      gasPrice: gasPrice,
      nonce: nonce,
      chainId: 137
    };

    // ПРАВИЛЬНОЕ ПОДПИСАНИЕ ТРАНЗАКЦИИ
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    res.status(200).json({
      success: true,
      transactionHash: receipt.transactionHash
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
