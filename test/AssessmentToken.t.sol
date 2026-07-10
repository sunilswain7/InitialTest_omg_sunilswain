// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.20;

  import "forge-std/Test.sol";
  import "../contracts/AssessmentToken.sol";

  contract AssessmentTokenTest is Test {
      AssessmentToken token;
      address deployer = address(1);
      address alice = address(2);
      address bob = address(3);

      function setUp() public {
          vm.prank(deployer);
          token = new AssessmentToken(1000);
      }

      function testInitialSupply() public view {
          uint256 expected = 1000 * 10 ** 18;
          assertEq(token.totalSupply(), expected);
          assertEq(token.balanceOf(deployer), expected);
      }

      function testTransfer() public {
          vm.prank(deployer);
          token.transfer(alice, 100);
          assertEq(token.balanceOf(alice), 100);
      }

      function testTransferFailsToZeroAddress() public {
          vm.prank(deployer);
          vm.expectRevert("transfer to zero address");
          token.transfer(address(0), 100);
      }

      function testTransferFailsInsufficientBalance() public {
          vm.prank(alice);
          vm.expectRevert("insufficient balance");
          token.transfer(bob, 100);
      }

      function testApproveAndTransferFrom() public {
          vm.prank(deployer);
          token.approve(alice, 500);
          assertEq(token.allowance(deployer, alice), 500);

          vm.prank(alice);
          token.transferFrom(deployer, bob, 200);
          assertEq(token.balanceOf(bob), 200);
          assertEq(token.allowance(deployer, alice), 300);
      }

      function testTransferFromFailsExceedAllowance() public {
          vm.prank(deployer);
          token.approve(alice, 100);

          vm.prank(alice);
          vm.expectRevert("allowance exceeded");
          token.transferFrom(deployer, bob, 200);
      }

      function testIncreaseAllowance() public {
          vm.prank(deployer);
          token.approve(alice, 100);

          vm.prank(deployer);
          token.increaseAllowance(alice, 50);
          assertEq(token.allowance(deployer, alice), 150);
      }

      function testDecreaseAllowance() public {
          vm.prank(deployer);
          token.approve(alice, 100);

          vm.prank(deployer);
          token.decreaseAllowance(alice, 30);
          assertEq(token.allowance(deployer, alice), 70);
      }

      function testDecreaseAllowanceFailsBelowZero() public {
          vm.prank(deployer);
          token.approve(alice, 50);

          vm.prank(deployer);
          vm.expectRevert("decreased below zero");
          token.decreaseAllowance(alice, 100);
      }
  }