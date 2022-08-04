//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Casino {

  struct ProposedBet {
    address sideA;
    uint value;
    uint placedAt;
    bool accepted;   
  }    // struct ProposedBet


  struct AcceptedBet {
    address sideB;
    uint acceptedAt;
    uint hashRandom;
    uint random;
    bool revealedByB;
  }   // struct AcceptedBet

  // Proposed bets, keyed by the commitment value
  mapping(uint => ProposedBet) public proposedBet;

  // Accepted bets, also keyed by commitment value
  mapping(uint => AcceptedBet) public acceptedBet;

  event BetProposed (
    uint indexed _commitment,
    uint value
  );

  event BetAccepted (
    uint indexed _commitment,
    address indexed _sideA
  );


  event BetSettled (
    uint indexed _commitment,
    address winner,
    address loser,
    uint value    
  );


  // Called by sideA to start the process
  function proposeBet(uint _commitment) external payable {
    require(proposedBet[_commitment].value == 0,
      "there is already a bet on that commitment");
    require(msg.value > 0,
      "you need to actually bet something");

    proposedBet[_commitment].sideA = msg.sender;
    proposedBet[_commitment].value = msg.value;
    proposedBet[_commitment].placedAt = block.timestamp;
    // accepted is false by default

    emit BetProposed(_commitment, msg.value);
  }  // function proposeBet


  // Called by sideB to continue
  function acceptBet(uint _commitmentA, uint _commitmentB) external payable {

    require(!proposedBet[_commitmentA].accepted,
      "Bet has already been accepted");
    require(proposedBet[_commitmentA].sideA != address(0),
      "Nobody made that bet");
    require(msg.value == proposedBet[_commitmentA].value,
      "Need to bet the same amount as sideA");

    acceptedBet[_commitmentA].sideB = msg.sender;
    acceptedBet[_commitmentA].acceptedAt = block.timestamp;
    acceptedBet[_commitmentA].hashRandom = _commitmentB;
    acceptedBet[_commitmentA].revealedByB = false;
    proposedBet[_commitmentA].accepted = true;

    emit BetAccepted(_commitmentA, proposedBet[_commitmentA].sideA);
  }   // function acceptBet


  // Called by bothSide to reveal their random value and conclude the bet
  function reveal(uint _commitmentA, uint _random) external {
    uint _commitment = uint256(keccak256(abi.encodePacked(_random)));
    address payable _sideB = payable(acceptedBet[_commitmentA].sideB);

    if (msg.sender == _sideB) {
      require(acceptedBet[_commitmentA].hashRandom == _commitment, "Please enter correct random number");
      acceptedBet[_commitmentA].revealedByB = true;
      acceptedBet[_commitmentA].random = _random;
      return;
    }

    require(acceptedBet[_commitmentA].revealedByB, "sideB does not reveal yet");

    address payable _sideA = payable(msg.sender);
    uint _agreedRandom = _random ^ acceptedBet[_commitment].random;
    uint _value = proposedBet[_commitment].value;

    require(proposedBet[_commitment].sideA == msg.sender,
      "Not a bet you placed or wrong value");
    require(proposedBet[_commitment].accepted,
      "Bet has not been accepted yet");

    // Pay and emit an event
    if (_agreedRandom % 2 == 0) {
      // sideA wins
      _sideA.transfer(2*_value);
      emit BetSettled(_commitment, _sideA, _sideB, _value);
    } else {
      // sideB wins
      _sideB.transfer(2*_value);
      emit BetSettled(_commitment, _sideB, _sideA, _value);      
    }

    // Cleanup
    delete proposedBet[_commitment];
    delete acceptedBet[_commitment];

  }  // function reveal

}   // contract Casino
