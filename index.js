require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

const abi = JSON.parse(fs.readFileSync('./MyTokenABI.json')).abi;

const localProvider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL);
const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

const localSigner = wallet.connect(localProvider);
const sepoliaSigner = wallet.connect(sepoliaProvider);

const localContract = new ethers.Contract(process.env.CONTRACT_ADDRESS_LOCAL, abi, localSigner);
const sepoliaContract = new ethers.Contract(process.env.CONTRACT_ADDRESS_SEPOLIA, abi, sepoliaSigner);

function getContract(chain) {
  return chain === 'sepolia' ? sepoliaContract : localContract;
}

app.post('/mint', async (req, res) => {
  const { to, amount, chain } = req.body;
  try {
    const tx = await getContract(chain).mint(to, ethers.parseUnits(amount, 18));
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post('/burn', async (req, res) => {
  const { amount, chain } = req.body;
  try {
    const tx = await getContract(chain).burn(ethers.parseUnits(amount, 18));
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.post('/transfer', async (req, res) => {
  const { to, amount, chain } = req.body;
  try {
    const tx = await getContract(chain).transfer(to, ethers.parseUnits(amount, 18));
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.get('/balanceOf/:address', async (req, res) => {
  const chain = req.query.chain || 'local';
  try {
    const balance = await getContract(chain).balanceOf(req.params.address);
    res.json({ balance: ethers.formatUnits(balance, 18) });
  } catch (e) {
    res.status(400).json({ error: e.reason || e.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
