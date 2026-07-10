// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.20;

  import "forge-std/Script.sol";
  import "../contracts/AssessmentToken.sol";

  contract DeployToken is Script {
      function run() external {
          vm.startBroadcast();
          AssessmentToken token = new AssessmentToken(1000000);
          vm.stopBroadcast();
          console.log("AssessmentToken deployed to:", address(token));
      }
  }