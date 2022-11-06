import { ethers } from "./ethers-5.2.esm.min.js";
import { abi, contractAddress } from "../constant.js";

const connectBtn = document.getElementById('connectBtn');
connectBtn.onclick = connect
const fundBtn = document.getElementById('fundBtn');
fundBtn.onclick = fund
const withdrawBtn = document.getElementById('withdrawBtn');
withdrawBtn.onclick = withdraw
const balanceBtn = document.getElementById('balanceBtn');
balanceBtn.onclick = getBalance
const showFund = document.getElementById('showFund');

const successMsg = document.getElementById('successMsg');
const errorMsg = document.getElementById('errorMsg');


const handleError = (error) => {
    if(error?.code == '-32002'){
        connect()
    }else{
        let msg = error?.message || "Error while connecting to MetaMask!";
     
        if(error?.code == 'INSUFFICIENT_FUNDS'){
            // in sufficient fund
            msg = 'INSUFFICIENT_FUNDS';
        }
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = msg;
    }
}

const getConnectedContractProvider = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            clearMsg()
            const ethereum = window.ethereum;
            // connect to MetaMask
            const provider = new ethers.providers.Web3Provider(ethereum);
          
            const signer = provider.getSigner();
            console.log('signer', (await signer.getAddress()))

            const contract =  new ethers.Contract(contractAddress, abi, signer);

            return [ contract, provider ]
    
        } catch (error) {
          handleError(error)
        }
        return [null, null]
      }else{
        connectBtn.innerHTML = "Please Install MetaMask";
      }
      return [null, null]
}

async function connect() {
  if (typeof window.ethereum !== 'undefined') {
    try {
        const ethereum = window.ethereum;
        // connect to MetaMask
        await ethereum.request({ method: "eth_requestAccounts" });
        connectBtn.innerHTML = "Connected !";
        console.log("Connected!");
    } catch (error) {
        return handleError(error)
    }
  
  }else{
    connectBtn.innerHTML = "Please Install MetaMask";
  }
}

async function fund(){
    const ethAmount = document.getElementById('ethAmount').value;

    if(!ethAmount){
        return;
    }

   try {

        const [contract, provider] = await getConnectedContractProvider()

        const trxResponse = await contract.fund({
            value: ethers.utils.parseEther(ethAmount.toString())
        })

        // await trxResponse.wait(1)
        // listen for blockchain events
        await listenForTransactionMine(trxResponse, provider)
        console.log('Done!')
   } catch (error) {
    return handleError(error)
   }

}

async function withdraw(){
    try {
        const [contract, provider] = await getConnectedContractProvider()

        const trxResponse = await contract.withdraw();
    
        // listen for blockchain events
        await listenForTransactionMine(trxResponse, provider)
        console.log('Done!')

    } catch (error) {
        return handleError(error)
    }
}

async function getBalance(){
    try {
        const [contract, provider] = await getConnectedContractProvider()

        let balance = await provider.getBalance(
            contract.address
        )

        balance = `${balance/10**18}`

        console.log("FundMe balance")
        console.log(balance)

        showFund.innerHTML = balance;
    } catch (error) {
        return handleError(error)
    }
}

function listenForTransactionMine(trxResponse, provider){
    console.log(`mining ${trxResponse.hash}`)
    return new Promise((resolve, reject) =>{
        provider.once(trxResponse.hash, (trxReceipt)=>{
            const _s = `
            Completed with ${trxReceipt.confirmations} confirmations
            `;
            console.log(_s)
            successMsg.style.display = 'block';
            successMsg.innerHTML = _s;
            resolve()
        })
    })
}

function clearMsg() {
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
}
