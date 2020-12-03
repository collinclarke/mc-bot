import { generateDisobidienceMessage } from 'src/Utilities/conversation'

import BasicBot from './BasicBot'
import { Vec3 } from 'vec3'
import NavigationBot from './NavigationBot'
import {
  GetBlockAtNotePosition,
  noteblockKernel,
  Constants,
} from '../Utilities/MusicBotUtils'

import * as MidiPlayer from 'midi-player-js'

export default class MusicBot extends NavigationBot {
  public Player: MidiPlayer.Player
  public noteMap
  public playing
  public tuning
  public validateLoop

  initPlugins() {
    super.initPlugins()

    this.Player = new MidiPlayer.Player()

    this.Player.on('midiEvent', (event) => {
      let track = parseInt(event['track'])
      let tick = event['tick']
      let name = event['name']
      let noteName = event['noteName']
      let noteNumber = event['noteNumber']
      let velocity = event["velocity"]

      if (track != 2 && track != 3) return
      if(velocity == 0) return
      if (name.toLowerCase() != 'note on') return

      console.log("playing " + noteNumber + " (" + Constants.NOTES[noteNumber] + ")");
      this.playNoteAtPosition(this.noteMap.get(noteNumber))
    })

    this.bot.on('noteHeard',(block, instrument, pitch)=>
    {
      if(this.playing)
        return;
        console.log("heard"  + pitch);
    });
  
    this.Player.loadFile('A:/mc-bot/src/Data/debug.mid')
    this.noteMap = new Map()
    let trackOne = this.getDistinctNotes(1)

    for(var x =0; x < trackOne.length; x++)
    {
      this.noteMap.set(trackOne[x],x)
    }

    let trackTwo = this.getDistinctNotes(2)

    for(var x =0; x < trackTwo.length; x++)
    {
      this.noteMap.set(trackTwo[x],x + trackOne.length)
    }

  }

  startPlayback() {
    this.Player.play()
    this.playing = true;
  }

  stopPlayback()
  {
    this.playing = false;
    clearInterval(this.validateLoop)
    this.Player.stop();
  }

  getDistinctNotes(track: number) {
    let lookup = {}
    let items = this.Player.getEvents()[track]
    let result = []

    for (var item, i = 0; (item = items[i++]); ) {
      var name = item['noteNumber']
      if (!(name in lookup) && typeof name != 'undefined') {
        lookup[name] = 1
        result.push(name)
      }
    }

    for(var x =0 ; x < result.length;x++)
    {
      console.log(result[x] + "   ("+Constants.NOTES[result[x]]+")")
    }
    return result
  }

  parseMessage(username: string, message: string, whisper?: boolean) {
    super.parseMessage(username, message, whisper)

    if (message.toLowerCase() == 'play music') {
      this.startPlayback()
    }

    if (message.toLowerCase() == 'validate kernel') {
      this.validateKernel()
    }

    if(message.toLowerCase() == 'tune your instrument')
    {

    }

    if (message.toLowerCase() == 'stop') {
      this.stopPlayback();
    }
  }

  public validateKernel() {
    let index = 0

    this.validateLoop = setInterval(() => {
      if (index >= noteblockKernel.length) index = 0
      this.playNoteAtPosition(index)
      index++
    }, 10)
  }

  playNoteAtPosition(position: number) {
    if (position > noteblockKernel.length) {
      return
    }

    let offset = noteblockKernel[position]
    let botPos = this.bot.entity.position

    let modX = Math.floor(botPos.x) + offset[0]
    let modY = Math.floor(botPos.y) - 1
    let modZ = Math.floor(botPos.z) + offset[1]

    let block = this.bot.blockAt(new Vec3(modX, modY, modZ))

    if (block == null) return

    this.bot.dig(block, (err) => {})
    setTimeout(() => {
      this.bot.stopDigging()
    }, 10)
  }
}
