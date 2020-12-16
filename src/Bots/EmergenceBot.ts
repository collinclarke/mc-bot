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

export default class EmergenceBot extends NavigationBot {

  decision:BuildDecision
  builtBlocks: Vec3[] = []
  firstBlock: boolean = true;
  currentBlock = 0
  baseCentroid: Vec3
  buildSize = 100
  isFinished = false
  storageChests: Vec3[] = []
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
      let buildLocation = this.currentTarget.position
      this.decision = new BuildDecision(buildLocation.floored(), new Vec3(1,0,0))
      this.buildSize = parseInt(cmd[1])
      this.bot.removeListener('goal_reached', this.placeBlock)
      this.bot.on('goal_reached', this.placeBlock)
      this.equipItem(9)
      this.makeDecision()
    }
    if (message === 'stop') {
      this.isFinished = true;
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
  }

  // High level decisions (1. place first block, 2. plan base, 3. iterate procedurally through capping routine to form termite mound)
  makeDecision(){
    const item = this.itemByName("dirt")

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

    this.equipItem(9)
    
    if(this.firstBlock){     
      this.firstBlock = false
      this.builtBlocks.push(this.decision.position)
      this.goTo(this.decision.position)
    }else{
      // Plan base until we reach the requested size
      if(this.builtBlocks.length <= this.buildSize){
        this.decision = this.planMoundBase(this.buildSize/4)
        this.goTo(this.builtBlocks[this.builtBlocks.length-1])
      }else{
        // Plan cap until goal condition is met
        if(this.builtBlocks.length == this.buildSize+1){
          console.log("Done with base!")
          this.baseCentroid = this.getAverageVec(this.builtBlocks)
        }
        if(this.builtBlocks.length % this.buildSize == 0){
          this.baseCentroid = this.getAverageVec(this.builtBlocks)
        }
        console.log("capping mound")
        this.decision = this.planCapMound()
        this.goTo(this.builtBlocks[this.currentBlock])      
      }
    }
    console.log("Block Count: ", this.builtBlocks.length)
  }

  placeBlock = (goal) => {
    console.log("placeBlockEventCallback")
    if(this.decision == null){
      console.log("decision was null")
      return
    }    
    const refBlock = this.bot.blockAt(this.decision.position)  
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
              this.bot.on('goal_reached', this.placeBlock)
              this.makeDecision()
              chest.close()        
            });
          });
      }
      catch (err) {
          // Sometimes open chest will throw a few asserts if block is not a chest
          //cb(err, true);
      }
       
      
  }

  planCapMound(): BuildDecision{
    
    let centroidPlaned = new Vec3(this.baseCentroid.x, this.builtBlocks[this.currentBlock].y, this.baseCentroid.z)
    let toBuild:Vec3 = (centroidPlaned.minus(this.builtBlocks[this.currentBlock])).floored()
    if(toBuild.x == 0 && toBuild.z == 0 && this.builtBlocks.length >= this.buildSize*4){
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

    if(Math.floor(this.currentBlock / this.buildSize) % 2 == 0){
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