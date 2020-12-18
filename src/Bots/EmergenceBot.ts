import { generateDisobidienceMessage } from "src/Utilities/conversation";
import NavigationBot from "./NavigationBot";
import { Vec3 } from "vec3";
import { Chest } from "mineflayer"
import { Block } from "prismarine-block";


import * as minecraftCollect from "mineflayer-collectblock";
const collectPlugin = minecraftCollect.plugin

class BuildDecision{
    constructor(_position: Vec3, _face: Vec3){
      this.position = _position
      this.face = _face
    }
    position: Vec3;
    face: Vec3;
}
class EmergenceSaveStructure{
  decision:BuildDecision
  builtBlocks: Vec3[] = []
  firstBlock: boolean = true;
  currentBlock = 0
  baseCentroid: Vec3
  buildSize = 100
  stretchFactor = 0
  isFinished = false
  flipDecision = true
  storageChests: Vec3[] = []
  friendlyBlocks: Number[] = [1,2,4,6,8,9,10,12]
  
  constructor(x:EmergenceBot){
    this.decision = x.decision
    this.builtBlocks = x.builtBlocks
    this.firstBlock = x.firstBlock
    this.currentBlock = x.currentBlock
    this.baseCentroid = x.baseCentroid
    this.buildSize = x.buildSize
    this.stretchFactor = x.stretchFactor
    this.flipDecision = x.flipDecision
    this.storageChests = x.storageChests
    this.friendlyBlocks = x.friendlyBlocks
  }
}
export default class EmergenceBot extends NavigationBot {

  decision:BuildDecision
  builtBlocks: Vec3[] = []
  firstBlock: boolean = true;
  currentBlock = 0
  baseCentroid: Vec3
  buildSize = 100
  stretchFactor = 0
  isFinished = false
  flipDecision = true
  storageChests: Vec3[] = []
  friendlyBlocks: Number[] = [1,2,4,6,8,9,10,12]
  moundFaces = [
    new Vec3(1, 0, 0),
    new Vec3(0, 0, 1),
    new Vec3(1, 0, 0),
    new Vec3(0, 0, -1),
    new Vec3(-1, 0, 0),
    new Vec3(0, 0, -1),
    new Vec3(-1, 0, 0),
    new Vec3(0, 0, 1)
  ]

  initPlugins() {
    super.initPlugins()
    this.bot.loadPlugin(collectPlugin)
  }

  parseMessage(username: string, message: string, whisper?:boolean) {
    super.parseMessage(username, message, whisper)
    if (message.startsWith('build')) {
      const cmd = message.split(' ')
      this.decision = new BuildDecision(this.currentTarget.position.floored(), new Vec3(1,0,0))
      this.buildSize = parseInt(cmd[1])
      this.stretchFactor = parseInt(cmd[2])
      this.bot.removeListener('goal_reached', this.placeBlock)
      this.bot.on('goal_reached', this.placeBlock)

      // Protect against death glitch
      this.bot.once('spawn', () => {
        this.bot.removeListener('goal_reached', this.placeBlock)
      })
      this.makeDecision()
    }
    if (message == 'resume'){
      this.bot.removeListener('goal_reached', this.placeBlock)
      this.bot.on('goal_reached', this.placeBlock)
      this.makeDecision()
    }
    if (message === 'pause') {
      this.bot.removeListener('goal_reached', this.placeBlock)   
    }
    if (message === "reset"){
      this.bot.removeListener('goal_reached', this.placeBlock)   
      this.firstBlock = true
      this.builtBlocks = []
      this.currentBlock = 0
      this.isFinished = false
      this.bot.chat("abandoning current construction")
    }
    if(message.startsWith('gather')){
      const cmd = message.split(' ')
      this.gatherResources(parseInt(cmd[1]))
    }
    if(message === 'storage'){
      this.setStorageChests()
    }
    if(message === 'load'){
      this.loadProgress()
    }
  }

  makeDecision(){

    // 1. Check 
    const item = this.itemByName("dirt") // Change to include all friendly blocks!
    if(!item){      
      this.bot.chat("i am out of building blocks")
      this.bot.removeListener('goal_reached', this.placeBlock)
      if(this.storageChests.length > 0){
        this.bot.once('goal_reached', this.grabMats);
        this.goTo(this.storageChests[0])
      }else{
        this.bot.chat("i dont know about any storage chests to get more")
      }
      return     
    }

    // 2. Equip
    this.equipItem(9) // Change to include any friendly item! Maybe use output of checking as input
    
    // 3. Decision (A. First Block, B. Base, C. Grow)
    if(this.firstBlock){     
      this.firstBlock = false
      this.builtBlocks.push(this.decision.position)
      this.goTo(this.decision.position)
    }else{
      if(this.builtBlocks.length <= this.buildSize){
        this.decision = this.planMoundBase(this.buildSize/4)
        this.goTo(this.builtBlocks[this.builtBlocks.length-1])
      }else{
        if(this.builtBlocks.length == this.buildSize+1){
          this.baseCentroid = this.getAverageVec(this.builtBlocks)
        }
        if(this.builtBlocks.length % this.buildSize == 0){
          this.baseCentroid = this.getAverageVec(this.builtBlocks)
        }
        this.decision = this.planGrowMound()
        this.goTo(this.builtBlocks[this.currentBlock])      
      }
    }

    // 4. Report block count
    console.log("Block Count: ", this.builtBlocks.length)
    
    // 5. Save progress to file
    this.saveProgress()
  }

  saveProgress(){
    if(this.builtBlocks.length < 1) return
    let e = new EmergenceSaveStructure(this)
    var jsonString = JSON.stringify(e)
    var fs = require('fs');
    fs.writeFile("saves/build_progress.json", jsonString, function(err) {
      if (err) {
          console.log(err);
      }
    });
  }

  loadProgress(){   
    if(this.builtBlocks.length > 1) return
    var fs = require('fs');
    fs.readFile("saves/build_progress.json",'utf8',function (err,data) {
      if (err) {
        return console.log(err);
      }
      const x = JSON.parse(data)

      for(let i = 0; i<x.builtBlocks.length; i++){      
        this.builtBlocks.push(new Vec3(x.builtBlocks[i].x, x.builtBlocks[i].y, x.builtBlocks[i].z))
      }
      this.decision = x.decision
      this.firstBlock = x.firstBlock
      this.currentBlock = x.currentBlock
      this.baseCentroid = x.baseCentroid
      this.buildSize = x.buildSize
      this.stretchFactor = x.stretchFactor
      this.flipDecision = x.flipDecision
      this.storageChests = x.storageChests
      this.friendlyBlocks = x.friendlyBlocks


      this.bot.removeListener('goal_reached', this.placeBlock)
      this.bot.on('goal_reached', this.placeBlock)
      this.makeDecision()
    }.bind(this));
  }

  // checkForBuildingMats():boolean{
  //   let b = false
  //   for(let i = 0; i<this.friendlyBlocks.length; i++){
  //     if(this.itemByName("dirt")){
  //       b = true
  //     }
  //   }
  //   return true
  // }



  placeBlock = (goal) => {
    if(this.decision == null){
      console.log("decision was null")
      return
    }    
    console.log(this.decision.position)
    const refBlock = this.bot.blockAt(this.decision.position)  
    console.log("HERE3")

    this.bot.placeBlock(refBlock, this.decision.face, ()=>{
      if(this.bot.blockAt(refBlock.position.plus(this.decision.face)) != null){
        this.builtBlocks.push(this.bot.blockAt(refBlock.position.plus(this.decision.face)).position)
      }else{
        // Try placing the block again? Maybe just leave it
        this.builtBlocks.push(this.bot.blockAt(refBlock.position.plus(this.decision.face)).position)
      }
      if(!this.isFinished){
        this.makeDecision()
      }
    });
  }
  
  grabMats = (goal) => {      
      console.log("Got to the chests, refueling")
        try {
          const c = this.bot.blockAt(this.storageChests[0])
          const chest = this.bot.openChest(c);
          let itemsRemain = false;
          chest.once('open', () => {
            console.log("Opened chest: " + 0)
            let dirtCount = chest.count(9, null)
            console.log(0+": dirt count: " + dirtCount)
            chest.withdraw(9, null, dirtCount-1, (err)=>{
              console.log("Withdrew everything")
              chest.close()        
              this.bot.on('goal_reached', this.placeBlock)
              this.makeDecision()
            });
          });
      }
      catch (err) {
          // Sometimes open chest will throw a few asserts if block is not a chest
          //cb(err, true);
      }
  }

  planGrowMound(): BuildDecision{
    
    let centroidPlaned = new Vec3(this.baseCentroid.x, this.builtBlocks[this.currentBlock].y, this.baseCentroid.z)
    console.log("HERE")
    let toBuild:Vec3 = (centroidPlaned.minus(this.builtBlocks[this.currentBlock])).floored()
    if(toBuild.x == 0 && toBuild.z == 0 && this.builtBlocks.length >= this.buildSize*8){
      this.isFinished = true
      this.bot.chat("My mound is complete")
      this.bot.removeListener('goal_reached', this.placeBlock)   
      this.firstBlock = true
      this.builtBlocks = []
      this.currentBlock = 0
    }
    if(toBuild.x > toBuild.z){
      if(toBuild.x < 0){
        toBuild.x = -1
        toBuild.z = 0

      }else{
        toBuild.x = 1
        toBuild.z = 0
      }
    }else{
      if(toBuild.z < 0){
        toBuild.z = -1
        toBuild.x = 0
      }else{
        toBuild.z = 1
        toBuild.x = 0
      }
    }
    toBuild.y = 0
    this.currentBlock++

    // Probably that the structure extends outwards on this layer instead of inwards
    let prob = this.randomInteger(0, 100);
    if(prob <= 15){
      let temp = toBuild.z
      toBuild.z = toBuild.x
      toBuild.x = temp 
    }

    // If its time to flip decisions
    if(this.currentBlock % this.buildSize == 0){
      this.flipDecision = !this.flipDecision
      // Check probability that it will go vertically again (based on stretch factor)
      let prob = this.randomInteger(0, 100);
      if(prob < this.stretchFactor && !this.flipDecision){
        this.flipDecision = !this.flipDecision       
      }
    }

    if(this.flipDecision){
      return new BuildDecision(this.builtBlocks[this.currentBlock], new Vec3(0,1,0))
    }else{
      return new BuildDecision(this.builtBlocks[this.currentBlock], toBuild)
    }

  }

  planMoundBase(size): BuildDecision{
    let faceI
    let min = 0
    if(this.builtBlocks.length <= size){
      min = 0
    }else
    if(this.builtBlocks.length <= size*2){
      min = 2
    }else
    if(this.builtBlocks.length <= size*3){
      min = 4
    }else
    if(this.builtBlocks.length <= size*4){
      min = 6
    }  
    faceI = this.randomInteger(min, (min+1))
    return new BuildDecision(this.builtBlocks[this.builtBlocks.length-1], this.moundFaces[faceI])
  }

  getAverageVec(listToAverage:Vec3[]):Vec3{
    // Calculate centroid of structure
    var totalPos: Vec3 = new Vec3(0,0,0)
    for(let i = 0; i < listToAverage.length; i++){
      totalPos = totalPos.plus(listToAverage[i])
    }

    // Calculate average position
    let averagePos: Vec3 = new Vec3(
      totalPos.x/listToAverage.length,
      totalPos.y/listToAverage.length,
      totalPos.z/listToAverage.length)
    
    return averagePos
  }

  randomInteger(min, max) {  
    return Math.round(Math.random() * (max - min) + min); 
  }  

  gatherResources(distance){
    //this.equipItem(604) // equip dat diamond shovel, termite deserves the best tools
    this.bot.chat("Gather in area: " + distance)
    let startP = this.bot.entity.position
    let b = this.bot.findBlock({
      point: this.bot.entity.position,
      matching: 9,
      maxDistance: distance,
      count: ((distance*2)*(distance*2)*(distance*2)),
    },(e,bl) =>{
      if(bl.length){
        this.bot.collectBlock.collect(bl, {
          chestLocations: this.storageChests
        }, err => {
          if (err){
            console.log(err)            
          }
          else{
            //this.goTo(startP)            
            this.gatherResources(distance)
          }
        })
      }
    });
  }
  
  setStorageChests(){
    const bl = this.bot.findBlock({
      point: this.bot.entity.position,
      matching: 147,
      maxDistance: 20,
      count: 20
    }, (e, b) => {
      if(b.length){
        //console.log("I found: " + b.length)
        for(let i = 0; i<b.length; i++){
          let isUnique = true
          for(let c = 0; c<this.storageChests.length; c++){
            if(b[i].position.equals(this.storageChests[c])){
              isUnique = false
            }
          }
          if(isUnique){
            this.storageChests.push(b[i].position)
          }else{
           //console.log("I already know about this chest: " + b[i].position)
          }
        }
        this.bot.chat("i have memorized " + this.storageChests.length + " storage locations")
      }
    });
  }

  equipItem(id){
    const blockToPlace = this.bot.inventory.findInventoryItem(id, 0, false)
    
    if(blockToPlace != null){
      this.bot.equip(blockToPlace, 'hand', (err) => {
        if (err) {
        //this.bot.chat(`unable to equip item: ${err.message}`)
        }   
      })
    } 
  }

  itemByName (name) {
    return this.bot.inventory.items().filter(item => item.name === name)[0]
  }
}