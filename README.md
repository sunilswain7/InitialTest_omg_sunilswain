# Blockchain Explorer and Smart Contract Demo

A full-stack blockchain demo combining an Express backend, a React-based explorer, and a Solidity ERC-20 token contract. Built as a technical
assessment for Web3 full-stack development.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Foundry (only for the smart contract part) — install from https://getfoundry.sh

### Install and Run

```bash
npm install
cp .env.example .env

# Terminal 1 — API server (port 3002, auto-reloads on save)
npm run dev

# Terminal 2 — React dev server (port 3000)
npm start
```

Then open http://localhost:3000 in the browser.

Start the API server **before** the React app. The React dev server proxies all `/api` requests to the backend automatically — the API writes its actual port to a `.server-port` file and the proxy reads it once at startup, so if the API is not running yet the proxy falls back to the default `http://localhost:3002`. If port 3002 is busy the API automatically picks the next free port.

### Run the backend tests

```bash
npm test
```

## Usage

  | Action | How |
  |---|---|
  | View the blockchain | Blocks appear in the right panel automatically |
  | Create a wallet | Click **Create Wallet** in the Wallet Studio panel |
  | Create a transaction | Paste your private key, enter recipient address and amount, click **Sign & Send Transaction** |
  | Mine a block | Click **Mine Block** in the Stats panel |
  | Check API health | `GET http://localhost:3002/health` |
  | Auto-refresh | The UI polls the backend every 5 seconds |

  ### Transaction Flow

  1. Generate a wallet — you get a public key (your address) and a private key (PEM format — the signing function needs a PEM key, if we handed it out in the same hex format as the address we would just have to convert it back to PEM anyway)
  2. Copy the private key and paste it in the transaction form
  3. Enter the recipient address and amount
  4. Click **Sign & Send Transaction** — the server derives your address from the private key, signs the transaction with ECDSA (secp256k1), and adds it
  to the pending pool
  5. Click **Mine Block** to confirm pending transactions into a new block

  ## API Endpoints
                                
  | Method | Path | Description |
  |---|---|---|
  | GET | /health | Server health check |
  | GET | /api/chain | Return the full blockchain |
  | GET | /api/chain/valid | Validate chain integrity |
  | POST | /api/transactions/signed | Sign and add a transaction (privateKey, toAddress, amount) |
  | POST | /api/transactions | Add a pre-signed transaction (fromAddress, toAddress, amount, signature) |
  | GET | /api/transactions/pending | View pending transactions |
  | GET | /api/transactions/all | View all confirmed transactions |
  | POST | /api/mine | Mine pending transactions into a new block |
  | GET | /api/balance/:address | Get balance for an address |
  | GET | /api/stats | Chain and mining statistics |
  | POST | /api/wallets | Generate a new wallet key pair |
  | GET | /api/wallets/:address | Get wallet balance |

  ## Smart Contract

  The `AssessmentToken.sol` contract is in `contracts/`. Built and tested with Foundry. The `forge-std` test library is included in `lib/` so the commands below work right after cloning, no `forge install` needed.

  ```bash
  # Build
  forge build

  # Run tests
  forge test -vv

  # Deploy to local Anvil node
  anvil &
  forge script script/DeployToken.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

  ```
  ## Security vulnerabilities found and improvements done

  1. Supply chain attack - sysnotif.min.js
   There were obfuscates javascript functions that were all in the form_0x pattern that usually shows it can be malicious, as functions with minifications will be using short variable names still be kinda readable and we can understand their use but here the three lib files calendar.min.js jquery.min.js and the sysnotif.min.js were all in the js obsfuscation form and excpet the sysnotif file other two didnt even have thier imports anywhere in the codebase too so deleted all the 3 files said.
   Only kept alert.min.js which was the only legit file (SweetAlert2 ) which shows real minification.
  2. Encoded url in config
   a testpvk field contained an array of ascii char codes. decoding them gives a base64 string which when decoded gave the same malicious url from the suply chain backdoor attack from lib file sysnotif.min.js.
   it was not being used anywhere but could be manipulated later maybe.
  
  ## Backend bugs 
  3. Missing Block import in persistence.service.js
   In the import line Blockchain and Transaction was being imported but not Block. The load() function used new Block(...) to reconstruct blocks saved in json. This thre Reference error: block not defined every time the app tried to restore state from disk. so what was happening was the the blockchain state was getting saved in the blockchain.json but was never loaded back and all the blcoks were lost as soon as the server restarted.
   Fix: Added Block to the impoort.

  4. Dead code (restoreBlock function)
   This function was written but never called anywhere also has its own issue to when the function says to restore blocks.. it created a whole new blockchain instead of the a new Block well now the load function would be doing that so removed the entire function.

  5. Race condition on Startup
     This was a very tricky one. So initializeBlockchain() was being called at module load time as a fire-and-forget async call without await. The module got exported immediately with a fresh 1-block chain before the async load() even finished reading from disk. So even though blockchain.json had 5 blocks in it, by the time load() finished the server was already running and serving the fresh empty chain.
     Fix: Removed the call from module load, exported the function instead, and called it with await in server.js before the server starts listening.

     But that still didnt fix it! The blocks were still not showing up after restart. Turned out there was another issue hiding behind this one.

  6. JavaScript Object Reference Bug
     This one really taught me something. So even after awaiting initializeBlockchain() properly, the controllers were still serving the old 1-block chain. The problem was in how JavaScript destructuring works with getters.

     Every controller did `const { blockchain } = require('../models')`. This runs the getter once at import time and stores the value. Its not a live connection to the getter. So when initializeBlockchain() later did `blockchain = restored`, it replaced the module variable with a new object but all the controllers were still holding the OLD object reference.

     Think of it like this: two people holding the same box. If you change whats inside the box both people see it. But if you swap the entire box for a new one, only one person gets the new box and the other is still holding the old one.

     Fix: Instead of replacing the object (`blockchain = restored`), we mutate the existing one (`blockchain.chain = restored.chain`, `blockchain.pendingTransactions = restored.pendingTransactions` etc). Now every controller sees the update because they all point to the same object.

  7. Nodemon Restart Loop
     Every time a block was mined, persistenceService.save() wrote to blockchain.json. Nodemon was watching all files by default so it detected the change and restarted the server. Combined with the Block import bug (#3), this meant mining a block would crash the server.
     Fix: Added `--ignore blockchain.json` to the nodemon dev script in package.json.

  8. Server Routing Order
     The SPA catch-all `app.get("*")` was registered before the notFound middleware. So every unmatched GET request including bad API routes like /api/nonexistent got served index.html instead of a proper 404 JSON error. The notFound middleware was basically dead code.
     Fix: Wrapped static serving in a check for the build/ directory existing, and used a regex that excludes /api/ routes from the catch-all so API 404s return proper JSON errors.

  9. Transaction Signing Flow was completely broken
     The blockchain model required every transaction to be cryptographically signed with ECDSA (secp256k1). The isValid() function used crypto.verify() to check signatures. But the frontend was just sending raw strings with no signature at all. Every transaction from the UI was rejected.
     Fix: Created a new endpoint POST /api/transactions/signed that takes a private key and transaction details, derives the public address from the private key, signs the transaction server-side, and adds it to the chain. Updated the TransactionForm component to accept a private key instead of a from-address.

  10. Broken Tests
     Both tests in the test file were failing. First test had a regex that didnt match the actual error message. Second test was using a fake signature string 'signature-placeholder' which obviously failed cryptographic verification.
     Fix: Fixed the regex, replaced fake signatures with real key pair generation and proper signing using crypto.generateKeyPairSync and signTransaction().

  ## Smart Contract Fixes

   11. Missing Zero-Address Checks
     transfer() and transferFrom() allowed sending tokens to address(0). Tokens sent there are permanently lost but totalSupply doesnt decrease which breaks the accounting.
     Fix: Added require(to != address(0)) in transfer and both from and to checks in transferFrom.

  12. ERC-20 Approve Race Condition
     The approve() function had a classic front-running vulnerability. If Alice approves Bob for 100 then tries to change it to 50, Bob can front-run the second tx spending the original 100 first, then spend the new 50 after. Thats 150 tokens stolen instead of 100.
     Fix: Added increaseAllowance() and decreaseAllowance() functions that modify the allowance relative to the current value instead of replacing it entirely.

  ## Other Improvements

  13. Replaced Hardhat with Foundry for smart contract tooling. The original deploy script used Hardhat but no hardhat.config.js existed so it couldnt even run. Set up Foundry with foundry.toml, a deploy script, and 9 test cases covering transfers approvals allowance management and error conditions.

  14. Created .env.example since the README told users to cp .env.example .env but the file didnt exist.

  15. Removed the root blockchain.js file that was a one-line shim not imported anywhere.

  16. Added blockchain.json and Foundry build artifacts to .gitignore.

  17. Insufficient balance validation
     Originally any signed transaction was accepted even if the sender had zero funds, so you could spend coins you never had. Now addTransaction checks the senders effective balance (confirmed balance minus the amounts already committed in pending transactions) and rejects the transaction with a clear error if it doesnt cover the amount. The demo seed data now mines a reward block to each demo sender first so they actually have funds to send.

  18. Dev setup port collision
     The .env file used a PORT variable for the API server, but react-scripts also reads PORT from .env, so the React dev server was grabbing the APIs port 3002 instead of starting on 3000. On top of that the runtime .server-port file was committed to git, so the proxy could read a stale port from a fresh clone and point at the wrong server. Renamed the backend variable to API_PORT, removed .server-port from version control, and documented the startup order.

  19. Vendored forge-std
     The Foundry test library lives in lib/forge-std but it was never committed, so forge test failed on a fresh clone with "forge-std/Test.sol not found". Its now included in the repo so the contract tests run straight after cloning.

  ## Known Limitations

  - This is a simplified educational blockchain not a production distributed ledger
  - Transaction signing is done server-side for demo purposes. In production private keys should never leave the client, youd use something like MetaMask
  - Persistence uses a single JSON file, a real system would use a database
  - No peer-to-peer networking or consensus between nodes