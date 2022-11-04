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
const modalBtn = document.getElementById('modalBtn');
const modalMsg = document.getElementById('modalMsg');


const handleError = (error) => {
    if((/null/g).test(error?.message) || (/unknown/g).test(error?.message)){
        connect()
    }else{
        const msg = error?.message || "Error while connecting to MetaMask!";
        modalMsg.innerHTML = msg;
        modalBtn.click()
    }
}

const getConnectedContractProvider = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
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
        connectBtn.innerHTML = "Connected";
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

        const trxResponse = await contract.withdraw()

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

        balance = `${balance/10**18} ETH`

        console.log("FundMe balance")
        console.log(balance)

        modalMsg.innerHTML = balance;
        modalBtn.click()

    } catch (error) {
        return handleError(error)
    }
}

function listenForTransactionMine(trxResponse, provider){
    console.log(`mining ${trxResponse.hash}`)
    return new Promise((resolve, reject) =>{
        provider.once(trxResponse.hash, (trxReceipt)=>{
            console.log(`
            Completed with ${trxReceipt.confirmations} confirmations
            `)
            resolve()
        })
    })
}
