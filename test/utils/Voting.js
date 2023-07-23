const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Units tests of voting project", function () {
        let accounts;
        let vote;

    // On définit plusieurs accounts pour le vote
    before(async() => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        deployer2 = accounts[1]
        deployer3 = accounts[2]
    })

    // –––––––––———————————— ADD VOTERS –––––––––———————————— //

    describe("ADD VOTERS", async function(){
        beforeEach(async() => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")
        })

        it("Should addVoter", async function(){
            await expect(vote.addVoter(deployer.getAddress())).to.emit(vote, "VoterRegistered")

            let voter = await vote.getVoter(deployer.getAddress())

            await assert(voter.isRegistered === true)
        })

    
        it("Should NOT addVoter if this address is already registered", async function(){
            await vote.addVoter(deployer.getAddress())
            await expect(vote.addVoter(deployer.getAddress())).to.be.revertedWith("Already registered")
        
        })

        it("Should NOT addVoter if he's not the Owner", async function(){

            await expect(vote.connect(deployer3).addVoter(deployer.getAddress())).to.be.revertedWith("Ownable: caller is not the owner")

        })

    })

})

    // –––––––––———————————— VOTERS –––––––––———————————— //


    describe("GET VOTERS", async function(){
        beforeEach(async() => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")
            await vote.addVoter(deployer.getAddress())
        })


        it("Should getVoter", async function(){

            let voter = await vote.getVoter(deployer.getAddress())
            assert(voter.isRegistered === true)

        })

        it("Should NOT getVoter if he's not registered at voter", async function() {

            await expect(vote.connect(deployer3).getVoter(deployer.getAddress())).to.be.revertedWith("You're not a voter")

        })
    })


    // –––––––––———————————— PROPOSALS –––––––––———————————— //

    describe("PROPOSALS", async function() {

        beforeEach(async() => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")
            await vote.addVoter(deployer.getAddress())
        })

        it("Should addProposal", async function(){

            await vote.startProposalsRegistering()
            await expect(vote.addProposal("Test")).to.emit(vote, "ProposalRegistered")

            let proposal = await vote.getOneProposal(1)
            await assert(proposal.description === "Test")

        })

        it("Should NOT addProposal if Workflow status is NOT ProposalsRegistrationStarted", async function() {
            // Ajout d'une proposition "Test" alors que la session de proposition n'est pas ajoutée
            await expect(vote.addProposal("Test")).to.be.revertedWith("Proposals are not allowed yet")

        })

        it("Should NOT addProposal if in the input there are nothing", async function() {
            // Ajout d'une proposition vide
            await vote.startProposalsRegistering()
            await expect(vote.addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer")

        })

        it("Should NOT addProposal if he's not registered at voter", async function() {
            // Ajout d'une proposition "Test" par le deployer 3 qui n'a jamais été ajouté à la liste Voters
            await expect(vote.connect(deployer3).addProposal("Test")).to.be.revertedWith("You're not a voter")

        })

        it("Should getProposal", async function(){
            await vote.startProposalsRegistering()
            await vote.addProposal("Test")

            let proposal = await vote.getOneProposal(1)
            await assert(proposal.description === "Test")

        })

        it("Should NOT getProposal if he's not registered at voter", async function(){
            // Getter une proposition avec le deployer 3 alors qu'il n'a jamais été ajouté à la liste des Voters
            await expect(vote.connect(deployer3).getOneProposal(1)).to.be.revertedWith("You're not a voter")
        })


    })

    // –––––––––———————————— VOTES –––––––––———————————— //


    describe("VOTES", async function(){
        beforeEach(async() => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")
            await vote.addVoter(deployer.getAddress())
            await vote.addVoter(deployer2.getAddress())
            await vote.startProposalsRegistering()
            await vote.addProposal("Test")
        })

        
        it("Should set vote", async function() {

            await vote.endProposalsRegistering()
            await vote.startVotingSession()
            
            await expect(vote.setVote(1)).to.emit(vote, "Voted")

            // On récupère une premiere proposition ainsi qu'un voter
            let firstProposal = await vote.getOneProposal(1)
            let firstVoter = await vote.getVoter(deployer.getAddress())


            assert(firstVoter.votedProposalId.toString() === "1")
            assert(firstVoter.hasVoted === true)
            assert(firstProposal.voteCount.toString() === "1")

        })

        it("Should NOT setVote if workflow status is NOT in VotingSessionStarted", async function() {
            
            // La session de vote n'a pas démarré
            await expect(vote.setVote(1)).to.be.revertedWith("Voting session havent started yet")        

        }) 

        
        it("Should NOT setVote if voter has already voted", async function() {
            
            await vote.endProposalsRegistering()
            await vote.startVotingSession()
            
            await vote.setVote(1)
            
            // Plus haut on a définit que le deployer avait déjà voté, il re-vote et cela nous renvoit une erreur
            await expect(vote.setVote(1)).to.be.revertedWith("You have already voted")
            
        })
        
        it("Should NOT setVote if vote has not registered", async function() {

            await vote.endProposalsRegistering()
            await vote.startVotingSession()

            // La proposition 3 n'existe pas
            await expect(vote.setVote(3)).to.be.revertedWith("Proposal not found") 

        })

        it("Should NOT setVote if he's not registered at voter", async function() {
            
            // Le deployer 3 n'a pas été défini dans le beforeEach comme un voter
            await expect(vote.connect(deployer3).setVote(1)).to.be.revertedWith("You're not a voter")

        })

    })

    // –––––––––———————————— STATES –––––––––———————————— //

    describe("STATES", async function(){

        beforeEach(async () => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")

            await vote.addVoter(deployer.getAddress())
        })
    
        it("Should startProposalRegistering", async function(){
            await expect(vote.startProposalsRegistering()).to.emit(vote, "WorkflowStatusChange")
        })

        it("Should endProposalsRegistering", async function(){
            await vote.startProposalsRegistering()
            await expect(vote.endProposalsRegistering()).to.emit(vote, "WorkflowStatusChange")
        })

            it("Should NOT endProposalsRegistering if registering proposals phase have NOT started", async function(){
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await expect(vote.connect(deployer2).endProposalsRegistering()).to.be.revertedWith("Ownable: caller is not the owner")
            })

            it("Should NOT endProposalsRegistering if registering proposals phase have NOT started", async function(){
                await expect(vote.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet")
            })

            it("Should NOT startVotingSession if registering proposals have NOT finished", async function(){
                await expect(vote.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished")
            })

            it("Should NOT startVotingSession if registering proposals phase have NOT started", async function(){
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await expect(vote.connect(deployer2).startVotingSession()).to.be.revertedWith("Ownable: caller is not the owner")
            })

            it("Should NOT endVotingSession if voting session have NOT started", async function(){
                await expect(vote.endVotingSession()).to.be.revertedWith("Voting session havent started yet")
            })

            it("Should NOT startVotingSession if registering proposals phase have NOT started", async function(){
                await vote.startProposalsRegistering()
                await vote.endProposalsRegistering()
                await vote.startVotingSession()
                await vote.endVotingSession()
                await expect(vote.connect(deployer2).endVotingSession()).to.be.revertedWith("Ownable: caller is not the owner")
            })

    })


    // –––––––––———————————— TALLY VOTES –––––––––———————————— //

    describe("TALLY VOTES", async function(){

        beforeEach(async () => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")

            await vote.addVoter(deployer.getAddress())
            await vote.addVoter(deployer2.getAddress())
            
            await vote.startProposalsRegistering()

            await vote.addProposal("First proposal")
            await vote.connect(deployer2).addProposal("Second proposal")

            await vote.endProposalsRegistering()
            await vote.startVotingSession()

            await vote.setVote(2)        
            await vote.connect(deployer2).setVote(2)
        })
        
        it("Should return winning proposal ID", async function(){

            await vote.endVotingSession()
            
            await expect(vote.tallyVotes()).to.emit(vote, "WorkflowStatusChange")

            let winProposal = await vote.winningProposalID()
            await assert(winProposal.toString() === "2")

        })

        it("Should not return winning proposal ID if current status is not votingSessionEnded", async function(){

            await expect(vote.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")

        })

    })


    describe("Workflow status tests", async function() {

        before(async () => {
            await deployments.fixture(["voting"])
            vote = await ethers.getContract("Voting")
        })

        it("Should add voter", async function(){
            await vote.addVoter(deployer.getAddress())
            await vote.addVoter(deployer2.getAddress())
            await vote.addVoter(deployer3.getAddress())

            let voter = await vote.getVoter(deployer2.getAddress())

            assert(voter.isRegistered === true)
        })

        it("Should add proposal", async function(){

            await vote.startProposalsRegistering()
            await vote.addProposal("First proposal")
            await vote.connect(deployer2).addProposal("Second proposal")
            await vote.connect(deployer3).addProposal("Third proposal")

            let proposal = await vote.getOneProposal(1)
            assert(proposal.description === "First proposal")

        })

        it("Should set vote", async function(){
            await vote.endProposalsRegistering()
            await vote.startVotingSession()
            await vote.setVote(3)
            await vote.connect(deployer2).setVote(3)
            await vote.connect(deployer3).setVote(2)
            await vote.endVotingSession()
        })

        it("Should return win proposal", async function(){
            await expect(vote.tallyVotes()).to.emit(vote, "WorkflowStatusChange")

            let winProposal = await vote.winningProposalID()
            assert(winProposal.toString() === "3")
        })
    })